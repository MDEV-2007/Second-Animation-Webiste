import * as THREE from 'three';
import gsap from 'gsap';
import { BaseWorld } from './base.js';
import { makePoints, pointBuffers } from '../gfx.js';

// WORLD 1 — THE BIRTH OF CODE
// One glowing line of code explodes into particles; the particles become birds
// that fly into the sunrise. `ignite()` is called the moment the visitor begins.
export class BirthWorld extends BaseWorld {
  build() {
    const g = this.group;
    this.ignition = 0;

    // --- the glowing line of code ---
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.09, 0.09),
      // transparent:true is required or the opacity fade on ignition is ignored
      new THREE.MeshBasicMaterial({ color: 0xeafff3, transparent: true, opacity: 1 })
    );
    line.position.set(0, 1.6, 0);
    g.add(line);
    this.line = line;

    // soft glow slab behind the line
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x7dffb4, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.position.set(0, 1.6, -0.2);
    g.add(glow);
    this.glow = glow;

    // --- burst particles ---
    this.N = 1600;
    this.start = new Float32Array(this.N * 3);
    this.burst = new Float32Array(this.N * 3);
    const { pos, col, siz } = pointBuffers(this.N, (i) => {
      // start: strung along the line of code
      const sx = (Math.random() - 0.5) * 9;
      const sy = 1.6 + (Math.random() - 0.5) * 0.25;
      const sz = (Math.random() - 0.5) * 0.25;
      this.start[i * 3] = sx; this.start[i * 3 + 1] = sy; this.start[i * 3 + 2] = sz;
      // burst target: expanding cloud drifting toward the sun
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      const r = 6 + Math.random() * 14;
      this.burst[i * 3] = Math.sin(ph) * Math.cos(th) * r * 1.4;
      this.burst[i * 3 + 1] = 4 + Math.cos(ph) * r * 0.7;
      this.burst[i * 3 + 2] = -6 - Math.abs(Math.sin(ph) * Math.sin(th)) * r;
      const warm = Math.random();
      return {
        x: sx, y: sy, z: sz,
        color: new THREE.Color().lerpColors(new THREE.Color(0x7dffb4), new THREE.Color(0xff9e5c), warm).getHex(),
        size: 5 + Math.random() * 10,
      };
    });
    const { points, uniforms } = makePoints(pos, col, siz, { opacity: 0, twinkle: 0.5 });
    g.add(points);
    this.points = points;
    this.pUniforms = uniforms;

    // --- birds (instanced silhouettes) ---
    this.buildBirds();

    // faint horizon glow line
    const horizon = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 60),
      new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    horizon.position.set(0, -4, -120);
    g.add(horizon);
  }

  buildBirds() {
    this.birdCount = 110;
    // a shallow V (bird) built from two triangles
    const shape = new THREE.BufferGeometry();
    const v = new Float32Array([
      0, 0, 0, -1, 0.3, -0.25, 0, 0, -0.55,
      0, 0, 0, 0, 0, -0.55, 1, 0.3, -0.25,
    ]);
    shape.setAttribute('position', new THREE.BufferAttribute(v, 3));
    shape.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color: 0x0a0a12, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(shape, mat, this.birdCount);
    mesh.frustumCulled = false;
    this.birdMat = mat;
    this.birds = mesh;
    this.birdSeed = [];
    for (let i = 0; i < this.birdCount; i++) {
      this.birdSeed.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.7,
        yoff: (Math.random() - 0.5) * 8,
        xoff: (Math.random() - 0.5) * 22,
        flap: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.7,
      });
    }
    this.group.add(mesh);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3();
    this._p = new THREE.Vector3();
  }

  ignite() {
    if (this._ignited) return;
    this._ignited = true;
    gsap.to(this, { ignition: 1, duration: 4.2, ease: 'power2.inOut' });
    gsap.to(this.pUniforms.uOpacity, { value: 1, duration: 0.6 });
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    const ig = this.ignition;

    // pulsing code line before ignition
    const pulse = 0.7 + 0.3 * Math.sin(t * 3.0);
    this.line.material.opacity = (1 - THREE.MathUtils.smoothstep(ig, 0.0, 0.12));
    this.glow.material.opacity = 0.4 * pulse * (1 - THREE.MathUtils.smoothstep(ig, 0.0, 0.2));
    this.line.scale.x = 1 + Math.sin(t * 2.0) * 0.01;

    // particle burst: line -> cloud, then fade as birds take over
    const burstT = THREE.MathUtils.smoothstep(ig, 0.05, 0.55);
    const attr = this.points.geometry.attributes.position;
    const arr = attr.array;
    for (let i = 0; i < this.N; i++) {
      const j = i * 3;
      const drift = Math.sin(t * 0.8 + i) * 0.4 * burstT;
      arr[j] = this.start[j] + (this.burst[j] - this.start[j]) * burstT;
      arr[j + 1] = this.start[j + 1] + (this.burst[j + 1] - this.start[j + 1]) * burstT + drift;
      arr[j + 2] = this.start[j + 2] + (this.burst[j + 2] - this.start[j + 2]) * burstT;
    }
    attr.needsUpdate = true;
    this.pUniforms.uTime.value = t;
    this.pUniforms.uOpacity.value = ig < 0.55 ? Math.min(1, ig * 3) : Math.max(0, 1 - (ig - 0.55) * 3.5);

    // birds emerge and fly to the sun
    const birdOpacity = THREE.MathUtils.smoothstep(ig, 0.4, 0.75);
    this.birdMat.opacity = birdOpacity * 0.92;
    if (birdOpacity > 0.01) {
      const flight = THREE.MathUtils.smoothstep(ig, 0.4, 1.0);
      for (let i = 0; i < this.birdCount; i++) {
        const s = this.birdSeed[i];
        const along = flight * (30 + i * 0.4);
        const x = s.xoff + Math.sin(t * 0.4 + s.phase) * 3;
        const y = 5 + s.yoff + along * 0.28 + Math.sin(t * s.speed + s.phase) * 0.8;
        const z = -6 - along; // fly into the distance toward the sun
        this._p.set(x, y, z);
        const flap = Math.sin(t * 9 * s.speed + s.flap) * 0.55 + 0.55; // 0..1.1
        this._s.set(s.scale, s.scale * (0.5 + flap * 0.5), s.scale);
        const bank = Math.sin(t * 0.5 + s.phase) * 0.25;
        this._e.set(0.1, Math.PI, bank);
        this._q.setFromEuler(this._e);
        this._m.compose(this._p, this._q, this._s);
        this.birds.setMatrixAt(i, this._m);
      }
      this.birds.instanceMatrix.needsUpdate = true;
    }
  }
}
