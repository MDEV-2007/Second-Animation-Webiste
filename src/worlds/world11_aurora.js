import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, glowLines, emissive, solid } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// Aurora ribbon: a flowing curtain of light
const AURORA_VERT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(p.x * 0.06 + uTime * 0.5) * 6.0 + cos(p.y * 0.05 - uTime * 0.3) * 3.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const AURORA_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;
  varying vec2 vUv;
  void main() {
    // vertical falloff — bright at the base, dissolving at the top
    float v = pow(1.0 - vUv.y, 1.6);
    // rippling vertical striations
    float s = sin(vUv.x * 34.0 + uTime * 1.4) * 0.5 + 0.5;
    s *= sin(vUv.x * 11.0 - uTime * 0.7) * 0.5 + 0.5;
    float a = v * (0.35 + s * 0.65);
    a *= smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    vec3 col = mix(uA, uB, vUv.y + s * 0.2);
    gl_FragColor = vec4(col, a * 0.5);
  }
`;

// WORLD 11 — THE NORTHERN LIGHTS OF CLOUD COMPUTING
export class AuroraWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(320, 0x1a2c4a, { amp: 2.5, y: -6 }));

    // aurora curtains
    this.curtains = [];
    const mkCurtain = (x, z, w, h, a, b, rot) => {
      const geo = new THREE.PlaneGeometry(w, h, 60, 20);
      const uniforms = {
        uTime: { value: 0 },
        uA: { value: new THREE.Color(a) },
        uB: { value: new THREE.Color(b) },
      };
      const mat = new THREE.ShaderMaterial({
        vertexShader: AURORA_VERT, fragmentShader: AURORA_FRAG, uniforms,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, h / 2 + 14, z);
      m.rotation.y = rot;
      g.add(m);
      this.curtains.push(uniforms);
    };
    mkCurtain(-10, -70, 150, 60, 0x57ffc2, 0x2b7fff, 0.15);
    mkCurtain(20, -100, 130, 50, 0x8affd0, 0xb04cff, -0.25);
    mkCurtain(-30, -130, 120, 44, 0x57ffc2, 0x2b7fff, 0.4);

    // stars
    const { pos, col, siz } = pointBuffers(900, () => ({
      x: (Math.random() - 0.5) * 260, y: 20 + Math.random() * 90, z: 10 - Math.random() * 200,
      color: 0xdfe8ff, size: 1.6 + Math.random() * 2.6,
    }));
    const stars = makePoints(pos, col, siz, { opacity: 0.8, twinkle: 0.9 });
    g.add(stars.points);
    this.starsU = stars.uniforms;

    // Docker containers drifting across the sky
    this.containers = [];
    for (let i = 0; i < 14; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 1.5), emissive(0x2496ed, 0.7));
      c.position.set((Math.random() - 0.5) * 90, 14 + Math.random() * 26, 5 - Math.random() * 150);
      c.rotation.set(Math.random(), Math.random(), Math.random());
      g.add(c);
      this.containers.push(c);
    }

    // Kubernetes constellation
    const kp = [];
    const knodes = [];
    for (let i = 0; i < 7; i++) {
      const p = [(Math.random() - 0.5) * 40, 24 + Math.random() * 16, -50 - Math.random() * 60];
      knodes.push(p);
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), emissive(0x326ce5, 1.4));
      n.position.set(...p);
      g.add(n);
    }
    for (let i = 0; i < knodes.length - 1; i++) kp.push(...knodes[i], ...knodes[i + 1]);
    g.add(glowLines(kp, 0x326ce5, 0.45));

    // snowy ground reflecting the sky
    const ice = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 620),
      new THREE.MeshStandardMaterial({ color: 0x24406b, roughness: 0.25, metalness: 0.5, transparent: true, opacity: 0.5 })
    );
    ice.rotation.x = -Math.PI / 2;
    ice.position.y = -5.6;
    g.add(ice);

    const defs = [
      { title: 'AWS', sub: 'the backbone', accent: '#ff9900', pos: [-11, 10, -34] },
      { title: 'Docker', sub: 'containers adrift', accent: '#2496ed', pos: [11, 13, -66], width: 4 },
      { title: 'Serverless', sub: 'stars that scale', accent: '#57ffc2', pos: [-10, 11, -104], width: 4.2 },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(4,10,26,0.8)', width: d.width || 3.4 });
      c.position.set(...d.pos);
      c.userData.base = d.pos[1];
      c.userData.phase = Math.random() * 6.28;
      g.add(c);
      return c;
    });
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.starsU.uTime.value = t;
    for (const u of this.curtains) u.uTime.value = t;
    for (let i = 0; i < this.containers.length; i++) {
      const c = this.containers[i];
      c.position.x += dt * (1.6 + i * 0.12);
      if (c.position.x > 50) c.position.x = -50;
      c.rotation.y += dt * 0.3;
      c.rotation.x += dt * 0.12;
    }
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.6 + c.userData.phase) * 0.5;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
