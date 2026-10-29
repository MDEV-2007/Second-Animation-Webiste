import * as THREE from 'three';
import Lenis from 'lenis';
import { WORLDS, SPACING } from './worlds/registry.js';
import { makeSky, lerpColorInto } from './gfx.js';
import { PlaceholderWorld } from './worlds/base.js';
import { BirthWorld } from './worlds/world01_birth.js';
import { JapanWorld } from './worlds/world02_japan.js';
import { GreatWallWorld } from './worlds/world03_greatwall.js';
import { BambooWorld } from './worlds/world04_bamboo.js';
import { EgyptWorld } from './worlds/world05_egypt.js';
import { PetraWorld } from './worlds/world06_petra.js';
import { AmazonWorld } from './worlds/world07_amazon.js';
import { OceanWorld } from './worlds/world08_ocean.js';
import { RedwoodWorld } from './worlds/world09_redwood.js';
import { AlpsWorld } from './worlds/world10_alps.js';
import { AuroraWorld } from './worlds/world11_aurora.js';
import { CanyonWorld } from './worlds/world12_canyon.js';
import { NiagaraWorld } from './worlds/world13_niagara.js';
import { ReefWorld } from './worlds/world14_reef.js';
import { MachuWorld } from './worlds/world15_machu.js';
import { CyberpunkWorld } from './worlds/world16_cyberpunk.js';
import { SpaceWorld } from './worlds/world17_space.js';
import { FutureLabWorld } from './worlds/world18_futurelab.js';

// Every world is hand-built; PlaceholderWorld remains the safety net for any
// registry entry without a module.
const RICH = {
  birth: BirthWorld, japan: JapanWorld, greatwall: GreatWallWorld,
  bamboo: BambooWorld, egypt: EgyptWorld, petra: PetraWorld,
  amazon: AmazonWorld, ocean: OceanWorld, redwood: RedwoodWorld,
  alps: AlpsWorld, aurora: AuroraWorld, canyon: CanyonWorld,
  niagara: NiagaraWorld, reef: ReefWorld, machu: MachuWorld,
  cyberpunk: CyberpunkWorld, space: SpaceWorld, future: FutureLabWorld,
};

const CAM_BACK = 20;   // how far behind a world's centre the camera rides
const SCROLL_PER_WORLD = 1.35; // viewport-heights of scroll per world

export class Experience {
  constructor() {
    this.canvas = document.getElementById('stage');
    this.track = document.getElementById('scroll-track');
    this.clock = new THREE.Clock();
    this.gT = 0;          // smoothed global world position [0 .. N-1]
    this.targetT = 0;
    this.pointer = new THREE.Vector2(0, 0);
    this.onWorld = null;  // callback(index)
    this._lastIndex = -1;

    this._initRenderer();
    this._initScene();
    this._initWorlds();
    this._initScroll();
    this._bindEvents();

    this.worlds[0].ensureBuilt();
    this.worlds[0].group.visible = true;

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._w = Math.max(window.innerWidth, 1);
    this._h = Math.max(window.innerHeight, 1);
    this.renderer.setSize(this._w, this._h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    // `near` must stay generous or mid-ground geometry turns to milk; `far` stays
    // below SPACING so a neighbouring world is never visible from this one.
    this.scene.fog = new THREE.Fog(0x0a0f1e, 80, 235);

    this.camera = new THREE.PerspectiveCamera(55, this._w / this._h, 0.1, 1200);
    this.camera.position.set(0, 2, CAM_BACK);

    const sky = makeSky();
    this.sky = sky.mesh;
    this.skyU = sky.uniforms;
    this.scene.add(this.sky);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 0.9);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sun.position.set(20, 30, 10);
    this.scene.add(this.sun);

    this._initBloom();

    // reusable temp colors
    this._cTop = new THREE.Color();
    this._cBottom = new THREE.Color();
    this._cSun = new THREE.Color();
    this._cFog = new THREE.Color();
  }

  _initBloom() {
    this.composer = null;
    // Bloom is a big part of the "wow"; degrade gracefully if addons fail.
    import('three/addons/postprocessing/EffectComposer.js').then(async ({ EffectComposer }) => {
      const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
      const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      // gentle: enough to make emissives sing without washing out the frame.
      // A high threshold means only genuinely bright pixels bloom.
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(this._w, this._h), 0.30, 0.4, 0.92
      );
      this.bloom = bloom;
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(window.innerWidth, window.innerHeight);
      this.composer = composer;
    }).catch((e) => console.warn('Bloom unavailable, rendering direct:', e));
  }

  _initWorlds() {
    this.worlds = WORLDS.map((def, i) => {
      const Cls = RICH[def.id] || PlaceholderWorld;
      const w = new Cls(def, i);
      this.scene.add(w.group);
      return w;
    });
    // scroll length
    this.track.style.height = `${WORLDS.length * SCROLL_PER_WORLD * 100}vh`;
  }

  _initScroll() {
    this.lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1.0, smoothWheel: true });
    this.lenis.on('scroll', ({ scroll, limit }) => {
      const raw = limit > 0 ? scroll / limit : 0;
      this.targetT = raw * (WORLDS.length - 1);
    });
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  _onResize() {
    // Guard against a 0-sized viewport (e.g. the page booted in a hidden tab):
    // without this the canvas stays 0x0 until some later resize event.
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    this._w = w; this._h = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) this.composer.setSize(w, h);
    if (this.bloom) this.bloom.resolution.set(w, h);
  }

  // re-sync if the viewport changed without a resize event reaching us
  _syncSize() {
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    if (w !== this._w || h !== this._h) this._onResize();
  }

  igniteBirth() {
    const b = this.worlds[0];
    if (b.ignite) b.ignite();
  }

  goTo(index) {
    const limit = this.lenis.limit;
    const target = (index / (WORLDS.length - 1)) * limit;
    this.lenis.scrollTo(target, { duration: 2.2 });
  }

  get state() {
    const i = Math.round(this.gT);
    return { gT: this.gT, index: THREE.MathUtils.clamp(i, 0, WORLDS.length - 1), progress: this.gT / (WORLDS.length - 1) };
  }

  _updateCameraAndPalette(t, dt) {
    const N = WORLDS.length;
    const gT = this.gT;
    const i = Math.floor(THREE.MathUtils.clamp(gT, 0, N - 1.0001));
    const f = THREE.MathUtils.clamp(gT - i, 0, 1);
    const a = WORLDS[i], b = WORLDS[Math.min(i + 1, N - 1)];

    // ---- camera ----
    const idleX = Math.sin(t * 0.25) * 0.6 + this.pointer.x * 1.2;
    const idleY = Math.cos(t * 0.2) * 0.35 - this.pointer.y * 0.8;
    const camX = THREE.MathUtils.lerp(a.cam.x, b.cam.x, f) + idleX;
    const camY = THREE.MathUtils.lerp(a.cam.y, b.cam.y, f) + 2 + idleY;
    const camZ = -gT * SPACING + CAM_BACK;
    this.camera.position.set(camX, camY, camZ);

    const lookY = THREE.MathUtils.lerp(a.cam.lookY, b.cam.lookY, f) + 1.5;
    this._look = this._look || new THREE.Vector3();
    this._look.set(camX * 0.3 + this.pointer.x * 2, lookY, camZ - 40);
    this.camera.lookAt(this._look);

    const fov = THREE.MathUtils.lerp(a.cam.fov, b.cam.fov, f);
    if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }

    // ---- palette (sky, fog, lights) ----
    lerpColorInto(this._cTop, a.palette.top, b.palette.top, f);
    lerpColorInto(this._cBottom, a.palette.bottom, b.palette.bottom, f);
    lerpColorInto(this._cSun, a.palette.sun, b.palette.sun, f);
    lerpColorInto(this._cFog, a.palette.fog, b.palette.fog, f);
    const sunInt = THREE.MathUtils.lerp(a.palette.sunInt, b.palette.sunInt, f);
    const sdx = THREE.MathUtils.lerp(a.palette.sunDir[0], b.palette.sunDir[0], f);
    const sdy = THREE.MathUtils.lerp(a.palette.sunDir[1], b.palette.sunDir[1], f);
    const sdz = THREE.MathUtils.lerp(a.palette.sunDir[2], b.palette.sunDir[2], f);

    this.skyU.uTop.value.copy(this._cTop);
    this.skyU.uBottom.value.copy(this._cBottom);
    this.skyU.uSun.value.copy(this._cSun);
    this.skyU.uSunInt.value = sunInt;
    this.skyU.uSunDir.value.set(sdx, sdy, sdz);
    this.skyU.uTime.value = t;

    this.scene.fog.color.copy(this._cFog);
    this.hemi.color.copy(this._cTop);
    this.hemi.groundColor.copy(this._cBottom);
    this.sun.color.copy(this._cSun);
    // Scale both lights off sunInt so night worlds stay genuinely dark and let
    // their own emissive neon carry the image, instead of being flood-lit.
    this.sun.intensity = 0.3 + sunInt * 1.05;
    this.hemi.intensity = 0.3 + sunInt * 0.55;
    this.sun.position.set(-sdx * 40, Math.max(sdy, 0.1) * 60 + 20, -sdz * 40);

    // keep the sky centred on the camera → infinite
    this.sky.position.copy(this.camera.position);
  }

  _loop() {
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    this._syncSize();
    this.lenis.raf(performance.now());

    // silky approach to target scroll position
    this.gT += (this.targetT - this.gT) * Math.min(1, dt * 4.5);

    this._updateCameraAndPalette(t, dt);

    // build / show / update nearby worlds only
    for (let k = 0; k < this.worlds.length; k++) {
      const w = this.worlds[k];
      const focus = this.gT - k;
      const near = Math.abs(focus);
      if (near < 1.5) w.ensureBuilt();
      // Cull tighter than one world-step. Fog turns a distant neighbour the fog
      // colour but still draws it — so Mt. Fuji showed up as a dark silhouette
      // against World 1's sunrise. At |focus| >= 0.95 a world is >235u away,
      // past fog.far, so it emerges from haze instead of popping in.
      const visible = near < 0.95;
      w.group.visible = visible;
      if (visible && w.built) w.update(dt, focus, this.gT);
    }

    // notify HUD on world change
    const idx = this.state.index;
    if (idx !== this._lastIndex) {
      this._lastIndex = idx;
      if (this.onWorld) this.onWorld(idx);
    }

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
