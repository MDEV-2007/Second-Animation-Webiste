import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, glowLines, emissive, solid, scatter } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 9 — THE REDWOOD FOREST OF OPEN SOURCE
export class RedwoodWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(300, 0x2e1f14, { amp: 1.5, y: -5 }));

    // giant redwoods — each trunk is an open-source project
    const bark = solid(0x6b3b24, { roughness: 1 });
    this.trunks = [];
    scatter(30, { spread: 42, clear: 10, from: 15, to: -140 }, (x, z) => {
      const h = 70 + Math.random() * 50;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.8 + Math.random(), 3.2 + Math.random(), h, 12), bark);
      t.position.set(x, h / 2 - 5, z);
      g.add(t);
      this.trunks.push(t);
      // canopy far overhead
      const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(9 + Math.random() * 5, 1), solid(0x2f5f2a, { roughness: 1 }));
      cap.position.set(x, h - 4, z);
      g.add(cap);
    });

    // roots = git branches, glowing along the forest floor
    const roots = [];
    for (let i = 0; i < 26; i++) {
      const x0 = (Math.random() - 0.5) * 60, z0 = 10 - Math.random() * 140;
      roots.push(x0, -4.6, z0, x0 + (Math.random() - 0.5) * 16, -4.6, z0 - 8 - Math.random() * 12);
    }
    g.add(glowLines(roots, 0x7dffb4, 0.35));

    // the GitHub contribution graph lighting the forest floor
    const grid = new THREE.Group();
    const shades = [0x0e4429, 0x006d32, 0x26a641, 0x39d353];
    for (let c = 0; c < 26; c++) {
      for (let r = 0; r < 7; r++) {
        const lvl = Math.floor(Math.random() * 4);
        const cell = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), emissive(shades[lvl], 0.5 + lvl * 0.35));
        cell.rotation.x = -Math.PI / 2;
        cell.position.set(-9 + r * 1.9, -4.7, -20 - c * 1.9);
        grid.add(cell);
      }
    }
    g.add(grid);
    this.grid = grid;

    // pull requests falling as stars
    const { pos, col, siz } = pointBuffers(260, () => ({
      x: (Math.random() - 0.5) * 90, y: Math.random() * 70, z: 10 - Math.random() * 150,
      color: 0xffd98a, size: 3 + Math.random() * 4,
    }));
    const stars = makePoints(pos, col, siz, { opacity: 0.8, twinkle: 0.8 });
    g.add(stars.points);
    this.stars = stars.points;
    this.starsU = stars.uniforms;

    const defs = [
      { title: 'git commit', sub: 'leaves', accent: '#39d353', mono: true, pos: [-10, 12, -34] },
      { title: 'Pull Request', sub: 'falling stars', accent: '#ffd98a', pos: [11, 15, -70], width: 4 },
      { title: 'Open Source', sub: 'roots run deep', accent: '#7dffb4', pos: [-9, 10, -106], width: 4 },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, mono: d.mono, glass: 'rgba(14,10,6,0.75)', width: d.width || 3.4 });
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
    // PR stars drift down and wrap
    const sp = this.stars.geometry.attributes.position;
    const arr = sp.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= dt * (3 + (i % 5));
      if (arr[i + 1] < -4) arr[i + 1] = 70;
    }
    sp.needsUpdate = true;
    // contribution cells breathe
    this.grid.children.forEach((c, i) => {
      c.material.emissiveIntensity = 0.4 + (Math.sin(t * 1.5 + i * 0.35) * 0.5 + 0.5) * 0.9;
    });
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.7 + c.userData.phase) * 0.45;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
