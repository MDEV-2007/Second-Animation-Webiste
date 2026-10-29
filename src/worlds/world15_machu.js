import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, emissive, solid, glowLines } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 15 — MACHU PICCHU OF PROBLEM SOLVING
export class MachuWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(320, 0x3f6b42, { amp: 4, y: -14 }));

    const stone = solid(0x9a9384, { roughness: 1 });
    const stoneDark = solid(0x7d7668, { roughness: 1 });

    // terraces climbing the mountainside — each step is a solved subproblem
    for (let side of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        const w = 26 - i * 1.2;
        const t = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, 120), i % 2 ? stone : stoneDark);
        t.position.set(side * (16 + i * 3.2), -13 + i * 1.7, -60);
        g.add(t);
      }
    }

    // the citadel ahead
    const citadel = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const w = 3 + Math.random() * 3;
      const h = 3 + Math.random() * 4;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), stone);
      b.position.set((Math.random() - 0.5) * 30, h / 2 - 2, -110 - Math.random() * 22);
      citadel.add(b);
      // trapezoidal doorway glow
      const d = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.3, h * 0.5), emissive(0xffd98a, 1.0));
      d.position.set(b.position.x, b.position.y - h * 0.2, b.position.z + w / 2 + 0.05);
      citadel.add(d);
    }
    g.add(citadel);

    // Huayna Picchu behind it
    const mount = new THREE.Mesh(new THREE.ConeGeometry(40, 76, 6), solid(0x4a6b4a, { roughness: 1 }));
    mount.position.set(6, 24, -160);
    g.add(mount);

    // floating puzzles — rotating interlocking cubes
    this.puzzles = [];
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Group();
      const colors = [0xffd98a, 0x7dffb4, 0xff9ecb, 0x8ab4ff];
      for (let k = 0; k < 4; k++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), emissive(colors[k], 0.8));
        c.position.set((k % 2) * 1.2 - 0.6, Math.floor(k / 2) * 1.2 - 0.6, 0);
        p.add(c);
      }
      p.position.set((Math.random() - 0.5) * 30, 4 + Math.random() * 14, -18 - Math.random() * 90);
      p.userData.sp = 0.3 + Math.random() * 0.6;
      g.add(p);
      this.puzzles.push(p);
    }

    // logical pathways lighting the route
    const path = [];
    for (let i = 0; i < 24; i++) {
      const z = 5 - i * 5.5;
      path.push(-2, -12.6, z, 2, -12.6, z);
    }
    this.path = glowLines(path, 0xffd98a, 0.5);
    g.add(this.path);

    // highland mist
    const { pos, col, siz } = pointBuffers(420, () => ({
      x: (Math.random() - 0.5) * 100, y: -12 + Math.random() * 20, z: 5 - Math.random() * 150,
      color: 0xe8f2e0, size: 6 + Math.random() * 10,
    }));
    const mist = makePoints(pos, col, siz, { opacity: 0.12, twinkle: 0.2 });
    g.add(mist.points);
    this.mistU = mist.uniforms;

    const defs = [
      { title: 'Decompose', sub: 'break it down', accent: '#ffd98a', pos: [-11, 8, -30], width: 4 },
      { title: 'Invariants', sub: 'what holds true', accent: '#7dffb4', pos: [11, 11, -62], width: 4 },
      { title: 'Solve', sub: 'one step at a time', accent: '#ff9ecb', pos: [-10, 9, -96], width: 4.2 },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(12,22,12,0.72)', width: d.width });
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
    this.mistU.uTime.value = t;
    this.path.material.opacity = 0.32 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.35;
    for (const p of this.puzzles) {
      p.rotation.y += dt * p.userData.sp;
      p.rotation.x += dt * p.userData.sp * 0.4;
      p.position.y += Math.sin(t * 0.8 + p.userData.sp * 6) * dt * 0.5;
    }
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.6 + c.userData.phase) * 0.5;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
