import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, tree, glowLines, emissive, scatter } from './kit.js';
import { makePoints, pointBuffers, makeFallingField } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 7 — THE AMAZON OF AI
export class AmazonWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(300, 0x1d4a2e, { amp: 2, y: -5 }));

    // rainforest canopy
    scatter(46, { spread: 40, clear: 9, from: 15, to: -140 }, (x, z) => {
      const tr = tree(0x4a3524, 0x2f7a44, { h: 16 + Math.random() * 16, r: 3.6 + Math.random() * 2.4, blobs: 4 });
      tr.position.set(x, -5, z);
      tr.rotation.y = Math.random() * Math.PI;
      g.add(tr);
    });

    // a neural network growing between the trees
    this.neurons = [];
    const layers = [4, 6, 6, 3];
    const layerPos = [];
    layers.forEach((count, li) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        const p = [(i - (count - 1) / 2) * 4.2, 12 + (i % 2) * 2, -30 - li * 22];
        arr.push(p);
        const n = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 14), emissive(0x9dff7a, 1.3));
        n.position.set(...p);
        g.add(n);
        this.neurons.push(n);
      }
      layerPos.push(arr);
    });
    const synapses = [];
    for (let li = 0; li < layerPos.length - 1; li++) {
      for (const a of layerPos[li]) for (const b of layerPos[li + 1]) synapses.push(...a, ...b);
    }
    this.synapses = glowLines(synapses, 0x7dffb4, 0.16);
    g.add(this.synapses);

    // fireflies — the neurons of the forest
    const { pos, col, siz } = pointBuffers(420, () => ({
      x: (Math.random() - 0.5) * 80,
      y: Math.random() * 26 - 4,
      z: 10 - Math.random() * 150,
      color: Math.random() < 0.7 ? 0xffe27a : 0x9dff7a,
      size: 2.5 + Math.random() * 3.5,
    }));
    const flies = makePoints(pos, col, siz, { opacity: 0.75, twinkle: 0.9 });
    g.add(flies.points);
    this.flies = flies.uniforms;

    // drifting leaves
    const leaves = makeFallingField({
      count: 800, area: 30, colorA: 0x6fbf5a, colorB: 0x2f7a44,
      fall: 0.7, sway: 2.2, spin: 0.5, opacity: 0.7, size: 0.42,
    });
    leaves.mesh.position.y = 10;
    g.add(leaves.mesh);
    this.leaves = leaves.uniforms;

    // python vines: glowing snakes of code coiling around trunks
    this.vines = [];
    for (let i = 0; i < 5; i++) {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 8 }, (_, k) => new THREE.Vector3(
          Math.sin(k * 0.9 + i) * 5, k * 2.6 - 4, -25 - i * 22 + Math.cos(k * 0.7) * 3
        ))
      );
      const v = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.3, 8, false), emissive(0xffde57, 0.9));
      g.add(v);
      this.vines.push(v);
    }

    const defs = [
      { title: 'PyTorch', sub: 'autograd', accent: '#ee4c2c', pos: [-11, 16, -40] },
      { title: 'TensorFlow', sub: 'graphs', accent: '#ff9e2c', pos: [11, 14, -72] },
      { title: 'Neural Nets', sub: 'deep learning', accent: '#9dff7a', pos: [-10, 18, -104], width: 4 },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(6,26,14,0.72)', width: d.width || 3.4 });
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
    this.flies.uTime.value = t;
    this.leaves.uTime.value = t;
    this.synapses.material.opacity = 0.10 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.16;
    for (let i = 0; i < this.neurons.length; i++) {
      const pulse = Math.sin(t * 3 - i * 0.4) * 0.5 + 0.5;
      this.neurons[i].scale.setScalar(0.85 + pulse * 0.45);
      this.neurons[i].material.emissiveIntensity = 0.7 + pulse * 1.2;
    }
    for (let i = 0; i < this.vines.length; i++) this.vines[i].rotation.z = Math.sin(t * 0.3 + i) * 0.05;
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.7 + c.userData.phase) * 0.5;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.22;
    }
  }
}
