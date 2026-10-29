import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { makeFallingField } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 4 — THE BAMBOO FOREST OF CLEAN CODE
export class BambooWorld extends BaseWorld {
  build() {
    const g = this.group;

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(320, 64),
      new THREE.MeshStandardMaterial({ color: 0x21361f, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    g.add(ground);

    // Perfectly aligned bamboo — clean architecture made visible.
    // Instanced: this world was 1000+ draw calls as individual meshes.
    const green = new THREE.MeshStandardMaterial({ color: 0x4f9e3a, roughness: 0.7, emissive: 0x0f2e12, emissiveIntensity: 0.4, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2f5f24, roughness: 0.8 });

    this.stalkData = [];
    const ringData = [];
    for (let row = -3; row <= 3; row++) {
      if (Math.abs(row) < 1) continue; // keep the flight path clear
      for (let z = 8; z > -140; z -= 7) {
        const x = row * 7 + (Math.random() - 0.5) * 0.6;
        const h = 22 + Math.random() * 12;
        this.stalkData.push({ x, z, h, phase: Math.random() * 6.28 });
        for (let s = 2; s < h; s += 4) ringData.push({ x, y: s - 3, z });
      }
    }

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const v = new THREE.Vector3();

    // unit-height cylinder scaled per instance
    this.stalks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.42, 1, 8), green, this.stalkData.length);
    this.stalks.frustumCulled = false;
    this.stalkData.forEach((s, i) => {
      m.compose(v.set(s.x, s.h / 2 - 3, s.z), q.identity(), new THREE.Vector3(1, s.h, 1));
      this.stalks.setMatrixAt(i, m);
    });
    g.add(this.stalks);

    const rings = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.46, 0.46, 0.35, 8), dark, ringData.length);
    rings.frustumCulled = false;
    ringData.forEach((r, i) => {
      m.compose(v.set(r.x, r.y, r.z), q.identity(), one);
      rings.setMatrixAt(i, m);
    });
    g.add(rings);

    this._m = m; this._q = q; this._v = v; this._e = new THREE.Euler();

    // god rays filtering through the canopy
    this.rays = [];
    const rayMat = new THREE.MeshBasicMaterial({ color: 0xdfffcf, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(6, 90), rayMat.clone());
      ray.position.set((Math.random() - 0.5) * 30, 20, -20 - i * 16);
      ray.rotation.set(0.35, Math.random() * Math.PI, 0.2);
      g.add(ray);
      this.rays.push(ray);
    }

    // principles floating among the stalks
    this.cards = [];
    const defs = [
      { title: 'SOLID', sub: 'principles', accent: '#a7f36a', pos: [0, 9, -16] },
      { title: 'Dependency Injection', sub: 'inversion', accent: '#dfffcf', pos: [0, 6, -40], width: 4.6 },
      { title: 'Repository', sub: 'pattern', accent: '#7dffb4', pos: [0, 8, -66] },
      { title: 'Design Patterns', sub: 'reuse', accent: '#c8ff9a', pos: [0, 7, -92], width: 4 },
    ];
    for (const d of defs) {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, width: d.width || 3.2, glass: 'rgba(10,22,12,0.6)' });
      c.position.set(...d.pos);
      c.userData.base = d.pos[1];
      c.userData.phase = Math.random() * 6.28;
      g.add(c);
      this.cards.push(c);
    }

    // wind carrying code particles
    const dust = makeFallingField({ count: 900, area: 30, colorA: 0xdfffcf, colorB: 0x7dffb4, fall: 0.5, sway: 3.0, spin: 0.4, opacity: 0.5, size: 0.28 });
    dust.mesh.position.y = 8;
    g.add(dust.mesh);
    this.dust = dust.uniforms;
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.dust.uTime.value = t;
    // sway each stalk in the wind (instance matrices, ~90 of them)
    for (let i = 0; i < this.stalkData.length; i++) {
      const s = this.stalkData[i];
      this._e.set(0, 0, Math.sin(t * 0.6 + s.phase) * 0.02);
      this._q.setFromEuler(this._e);
      this._m.compose(this._v.set(s.x, s.h / 2 - 3, s.z), this._q, new THREE.Vector3(1, s.h, 1));
      this.stalks.setMatrixAt(i, this._m);
    }
    this.stalks.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < this.rays.length; i++) {
      this.rays[i].material.opacity = 0.04 + (Math.sin(t * 0.5 + i) * 0.5 + 0.5) * 0.05;
    }
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.7 + c.userData.phase) * 0.4;
      c.rotation.y = Math.sin(t * 0.25 + c.userData.phase) * 0.2;
    }
  }
}
