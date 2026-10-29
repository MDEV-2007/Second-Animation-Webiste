import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { emissive, solid } from './kit.js';
import { makeFallingField, makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 16 — THE CYBERPUNK CITY
export class CyberpunkWorld extends BaseWorld {
  build() {
    const g = this.group;

    // wet reflective street
    const street = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 620),
      new THREE.MeshStandardMaterial({ color: 0x0a0812, roughness: 0.12, metalness: 0.85 })
    );
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, -6, -60);
    g.add(street);

    // towers flanking a neon canyon
    const neon = [0xff2bd6, 0x00e5ff, 0xb14aff, 0xffd166, 0x39ff88];
    this.signs = [];
    const dark = solid(0x0d0b18, { roughness: 0.8, flatShading: false });
    for (let side of [-1, 1]) {
      for (let i = 0; i < 14; i++) {
        const h = 40 + Math.random() * 70;
        const w = 8 + Math.random() * 7;
        const z = 10 - i * 11 - Math.random() * 5;
        const x = side * (15 + Math.random() * 16);
        const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), dark);
        t.position.set(x, h / 2 - 6, z);
        g.add(t);

        // neon window strips
        const color = neon[Math.floor(Math.random() * neon.length)];
        for (let k = 0; k < 5; k++) {
          const strip = new THREE.Mesh(
            new THREE.PlaneGeometry(w * 0.75, 0.5),
            emissive(color, 1.6, { transparent: true, opacity: 0.9 })
          );
          strip.position.set(x - side * (w / 2 + 0.06), 4 + k * (h / 6), z);
          strip.rotation.y = side * Math.PI / 2;
          g.add(strip);
          this.signs.push({ mesh: strip, off: Math.random() * 6.28 });
        }
        // rooftop beacon
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), emissive(0xff3b3b, 2));
        beacon.position.set(x, h - 6, z);
        g.add(beacon);
        this.signs.push({ mesh: beacon, off: Math.random() * 6.28, fast: true });
      }
    }

    // holographic billboards showing the work
    const boards = [
      { title: 'AI ArtCAM', sub: 'image → DXF', accent: '#00e5ff', pos: [-13, 16, -30] },
      { title: 'AgentLab HQ', sub: 'agent platform', accent: '#ff2bd6', pos: [14, 22, -58] },
      { title: 'IlmMevasi', sub: 'learning bot', accent: '#39ff88', pos: [-14, 19, -86] },
      { title: 'ODYSSEY', sub: 'webgl portfolio', accent: '#ffd166', pos: [13, 15, -114] },
    ];
    this.boards = boards.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(6,2,16,0.72)', width: 7, ratio: 0.5 });
      c.position.set(...d.pos);
      c.rotation.y = d.pos[0] < 0 ? 0.5 : -0.5;
      c.userData.base = d.pos[1];
      c.userData.phase = Math.random() * 6.28;
      g.add(c);
      return c;
    });

    // flying vehicles — streaks of light crossing the canyon
    this.vehicles = [];
    for (let i = 0; i < 14; i++) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 0.22), emissive(i % 2 ? 0x00e5ff : 0xff2bd6, 2));
      v.userData.y = 12 + Math.random() * 34;
      v.userData.z = 5 - Math.random() * 130;
      v.userData.sp = 14 + Math.random() * 22;
      v.userData.dir = Math.random() < 0.5 ? 1 : -1;
      v.userData.off = Math.random() * 100;
      g.add(v);
      this.vehicles.push(v);
    }

    // rain
    const rain = makeFallingField({
      count: 2600, area: 34, colorA: 0x9fd8ff, colorB: 0xff9ee8,
      fall: 9.0, sway: 0.25, spin: 0.0, opacity: 0.35, size: 0.1,
    });
    rain.mesh.position.y = 14;
    g.add(rain.mesh);
    this.rain = rain.uniforms;

    // ground haze catching the neon
    const { pos, col, siz } = pointBuffers(300, () => ({
      x: (Math.random() - 0.5) * 70, y: -5 + Math.random() * 8, z: 5 - Math.random() * 140,
      color: neon[Math.floor(Math.random() * neon.length)], size: 3 + Math.random() * 4,
    }));
    const haze = makePoints(pos, col, siz, { opacity: 0.07, twinkle: 0.4 });
    g.add(haze.points);
    this.hazeU = haze.uniforms;
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.rain.uTime.value = t;
    this.hazeU.uTime.value = t;
    // neon flicker
    for (const s of this.signs) {
      const f = s.fast
        ? (Math.sin(t * 4 + s.off) > 0.4 ? 2 : 0.2)
        : 1.2 + Math.sin(t * 2.2 + s.off) * 0.5 + (Math.random() < 0.006 ? -1.0 : 0);
      s.mesh.material.emissiveIntensity = Math.max(0.1, f);
    }
    for (const v of this.vehicles) {
      const span = 70;
      const p = ((t * v.userData.sp + v.userData.off) % (span * 2)) - span;
      v.position.set(p * v.userData.dir, v.userData.y, v.userData.z);
    }
    for (const b of this.boards) {
      b.position.y = b.userData.base + Math.sin(t * 0.5 + b.userData.phase) * 0.4;
      b.material.opacity = 0.82 + Math.sin(t * 7 + b.userData.phase) * 0.08;
      b.material.transparent = true;
    }
  }
}
