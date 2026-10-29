import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, emissive, solid, scatter, glowLines } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 14 — THE GREAT BARRIER REEF OF REAL-TIME SYSTEMS
export class ReefWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(300, 0x0f6b68, { amp: 2.5, y: -10 }));

    // vivid coral — every colony is a live connection
    const palette = [0xff5c8a, 0xffb03d, 0x7dffd4, 0x8a6bff, 0x3dd6ff, 0xff7ae0];
    this.corals = [];
    scatter(60, { spread: 34, clear: 7, from: 12, to: -135 }, (x, z, i) => {
      const color = palette[i % palette.length];
      const c = new THREE.Group();
      const branches = 3 + Math.floor(Math.random() * 3);
      for (let b = 0; b < branches; b++) {
        const h = 3 + Math.random() * 6;
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.45 + Math.random() * 0.4, h, 4, 8), emissive(color, 0.55));
        arm.position.set((Math.random() - 0.5) * 2.6, h / 2, (Math.random() - 0.5) * 2.6);
        arm.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
        c.add(arm);
      }
      c.position.set(x, -9.5, z);
      c.userData.phase = Math.random() * 6.28;
      g.add(c);
      this.corals.push(c);
    });

    // brain corals = dashboards
    scatter(12, { spread: 26, clear: 9, from: 10, to: -130 }, (x, z, i) => {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 + Math.random(), 1), solid(0xffd9a8, { roughness: 0.9 }));
      b.position.set(x, -8.6, z);
      g.add(b);
    });

    // live notification bubbles that pop
    this.pops = [];
    for (let i = 0; i < 26; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 14), emissive(0x7dffd4, 1.2, { transparent: true, opacity: 0.75 }));
      p.position.set((Math.random() - 0.5) * 44, 2 + Math.random() * 16, 5 - Math.random() * 130);
      p.userData.off = Math.random() * 6.28;
      g.add(p);
      this.pops.push(p);
    }

    // a mesh of live connections overhead
    const nodes = [];
    for (let i = 0; i < 10; i++) nodes.push([(Math.random() - 0.5) * 44, 14 + Math.random() * 10, -20 - Math.random() * 100]);
    const seg = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() < 0.28) seg.push(...nodes[i], ...nodes[j]);
      }
    }
    this.mesh = glowLines(seg, 0x7dffd4, 0.3);
    g.add(this.mesh);
    for (const n of nodes) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), emissive(0xd0fff5, 1.5));
      m.position.set(...n);
      g.add(m);
    }

    // shimmering plankton
    const { pos, col, siz } = pointBuffers(500, () => ({
      x: (Math.random() - 0.5) * 80, y: -8 + Math.random() * 26, z: 8 - Math.random() * 140,
      color: 0xd0fff5, size: 2 + Math.random() * 3,
    }));
    const pl = makePoints(pos, col, siz, { opacity: 0.5, twinkle: 0.9 });
    g.add(pl.points);
    this.plankton = pl.uniforms;

    const defs = [
      { title: 'WebSockets', sub: 'always open', accent: '#7dffd4', pos: [-11, 6, -32], width: 4.2 },
      { title: 'Live Chat', sub: 'typing…', accent: '#ff5c8a', pos: [11, 9, -66] },
      { title: 'Presence', sub: '312 online', accent: '#3dd6ff', pos: [-10, 7, -100] },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(3,32,32,0.75)', width: d.width || 3.4 });
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
    this.plankton.uTime.value = t;
    this.mesh.material.opacity = 0.18 + (Math.sin(t * 2.5) * 0.5 + 0.5) * 0.22;
    for (const c of this.corals) c.rotation.z = Math.sin(t * 0.8 + c.userData.phase) * 0.05;
    for (const p of this.pops) {
      // grow, then pop, then respawn — a live notification
      const k = (t * 0.6 + p.userData.off) % 3;
      const s = k < 2 ? k / 2 : 1 - (k - 2);
      p.scale.setScalar(0.2 + s * 1.1);
      p.material.opacity = 0.25 + s * 0.55;
      p.position.y += dt * 0.7;
      if (p.position.y > 20) p.position.y = 2;
    }
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.6 + c.userData.phase) * 0.5;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
