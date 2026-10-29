import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, cliffWall, emissive, solid } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 12 — THE GRAND CANYON OF DEBUGGING
// Bugs die and the canyon heals as the visitor crosses.
export class CanyonWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(320, 0x8a4a2e, { amp: 2, y: -16 }));

    // layered canyon walls
    g.add(cliffWall(-1, 0xa8563a, { height: 54, dist: 20, from: 25, to: -140, step: 12 }));
    g.add(cliffWall(1, 0x8f4830, { height: 50, dist: 21, from: 25, to: -140, step: 12 }));
    g.add(cliffWall(-1, 0xc2704a, { height: 26, dist: 32, from: 25, to: -140, step: 14 }));
    g.add(cliffWall(1, 0xb9663f, { height: 30, dist: 33, from: 25, to: -140, step: 14 }));

    // a broken bridge — planks with gaps that repair as you pass
    this.planks = [];
    const plankMat = solid(0x5a3a26, { roughness: 1 });
    for (let i = 0; i < 42; i++) {
      const z = 5 - i * 3.4;
      const p = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 2.4), plankMat);
      p.position.set(0, -3, z);
      p.userData.z = z;
      p.userData.broken = i % 5 === 2 || i % 7 === 3; // gaps in the bridge
      g.add(p);
      this.planks.push(p);
    }
    // suspension cables
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 1 });
    for (const s of [-3.6, 3.6]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 150), cableMat);
      c.position.set(s, -0.6, -66);
      g.add(c);
    }

    // error messages carved into the rock
    this.errors = [];
    const errDefs = [
      { title: 'TypeError', sub: "undefined is not a function", pos: [-16, 8, -26] },
      { title: 'NullPointer', sub: 'line 42', pos: [17, 12, -58] },
      { title: 'Stack Trace', sub: '  at resolve()', pos: [-17, 6, -92] },
      { title: 'RESOLVED', sub: 'all tests green', pos: [16, 10, -124], ok: true },
    ];
    for (const d of errDefs) {
      const c = makePanel({
        title: d.title, sub: d.sub, mono: true,
        accent: d.ok ? '#7dffb4' : '#ff5c47',
        glass: 'rgba(24,8,4,0.8)', width: d.ok ? 4 : 4.4,
      });
      c.position.set(...d.pos);
      c.rotation.y = d.pos[0] < 0 ? 0.45 : -0.45;
      c.userData.base = d.pos[1];
      c.userData.phase = Math.random() * 6.28;
      g.add(c);
      this.errors.push(c);
    }

    // logs pouring down the canyon wall like a waterfall
    const { pos, col, siz } = pointBuffers(600, () => ({
      x: (Math.random() < 0.5 ? -1 : 1) * (17 + Math.random() * 5),
      y: Math.random() * 50 - 14,
      z: 5 - Math.random() * 140,
      color: Math.random() < 0.5 ? 0xffd166 : 0xff8a5c,
      size: 2 + Math.random() * 3,
    }));
    const logs = makePoints(pos, col, siz, { opacity: 0.6, twinkle: 0.5 });
    g.add(logs.points);
    this.logs = logs.points;
    this.logsU = logs.uniforms;

    // flowers that bloom in the healed stretch
    this.flowers = [];
    for (let i = 0; i < 70; i++) {
      const f = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        emissive([0xff7ab8, 0xffd166, 0xb08aff, 0x7dffb4][i % 4], 0.9)
      );
      f.position.set((Math.random() - 0.5) * 26, -15.4 + Math.random(), -40 - Math.random() * 100);
      f.scale.setScalar(0.01);
      g.add(f);
      this.flowers.push(f);
    }
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.logsU.uTime.value = t;

    // logs stream downward
    const lp = this.logs.geometry.attributes.position;
    const arr = lp.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= dt * (7 + (i % 6));
      if (arr[i + 1] < -16) arr[i + 1] = 36;
    }
    lp.needsUpdate = true;

    // `focus` runs -1 (approaching) → 0 (centred) → +1 (leaving):
    // use it so the canyon literally heals as the visitor crosses it.
    const heal = THREE.MathUtils.clamp((focus + 0.8) / 1.4, 0, 1);

    for (const p of this.planks) {
      if (!p.userData.broken) continue;
      // broken planks swing back into place as healing advances
      const local = THREE.MathUtils.clamp(heal * 1.6 - (5 - p.userData.z) / 150, 0, 1);
      p.rotation.z = (1 - local) * 1.4;
      p.position.y = -3 - (1 - local) * 2.5;
      p.visible = local > 0.05;
    }
    for (let i = 0; i < this.flowers.length; i++) {
      const s = THREE.MathUtils.clamp(heal * 1.8 - i / this.flowers.length, 0, 1);
      this.flowers[i].scale.setScalar(s * (0.9 + Math.sin(t * 2 + i) * 0.12));
    }
    for (const c of this.errors) {
      c.position.y = c.userData.base + Math.sin(t * 0.6 + c.userData.phase) * 0.35;
    }
  }
}
