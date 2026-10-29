import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, emissive, solid, scatter } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 8 — THE OCEAN OF APIs
export class OceanWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(320, 0x1b6a94, { amp: 3, y: -12, mat: { roughness: 1 } }));

    // shafts of light from the surface
    this.rays = [];
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xbdf0ff, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 10; i++) {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(7, 70), rayMat.clone());
      r.position.set((Math.random() - 0.5) * 60, 22, 5 - i * 15);
      r.rotation.set(0.28, Math.random() * Math.PI, 0.16);
      g.add(r);
      this.rays.push(r);
    }

    // a whale built from JSON — wireframe body, huge and slow
    const whale = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(9, 20, 14),
      new THREE.MeshStandardMaterial({ color: 0x0d3b6b, emissive: 0x1d7fc0, emissiveIntensity: 0.5, roughness: 0.6, wireframe: true })
    );
    body.scale.set(2.6, 1, 1);
    whale.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(4.5, 9, 4), emissive(0x1d7fc0, 0.5, { wireframe: true }));
    tail.position.set(25, 0, 0); tail.rotation.z = Math.PI / 2;
    whale.add(tail);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(2.5, 7, 4), emissive(0x1d7fc0, 0.5, { wireframe: true }));
    fin.position.set(2, -4, 5); fin.rotation.x = 0.7;
    whale.add(fin);
    whale.position.set(-16, 12, -78);
    g.add(whale);
    this.whale = whale;

    // coral reefs as SQL schemas
    scatter(34, { spread: 34, clear: 8, from: 10, to: -130 }, (x, z, i) => {
      const hue = [0xff7ab8, 0xffb066, 0x7dffb4, 0xb08aff][i % 4];
      const c = new THREE.Mesh(
        new THREE.ConeGeometry(1.2 + Math.random() * 1.6, 4 + Math.random() * 7, 6),
        solid(hue, { roughness: 0.7, flatShading: true })
      );
      c.position.set(x, -10 + Math.random() * 2, z);
      c.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * 3, (Math.random() - 0.5) * 0.3);
      g.add(c);
    });

    // schools of fish = API requests swimming past
    this.fishCount = 150;
    const fishGeo = new THREE.ConeGeometry(0.32, 1.3, 4);
    this.fish = new THREE.InstancedMesh(fishGeo, emissive(0xffe27a, 0.8), this.fishCount);
    this.fish.frustumCulled = false;
    g.add(this.fish);
    this.fishSeed = Array.from({ length: this.fishCount }, () => ({
      r: 6 + Math.random() * 22, a: Math.random() * 6.28, y: 2 + Math.random() * 18,
      z: 5 - Math.random() * 130, sp: 0.4 + Math.random() * 0.7, s: 0.6 + Math.random() * 0.8,
    }));
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion();
    this._e = new THREE.Euler(); this._v = new THREE.Vector3(); this._sc = new THREE.Vector3();

    // GraphQL portal
    this.portal = new THREE.Mesh(new THREE.TorusGeometry(6, 0.4, 14, 60), emissive(0xe535ab, 1.3));
    this.portal.position.set(10, 12, -110);
    g.add(this.portal);

    // rising bubbles / packets
    const { pos, col, siz } = pointBuffers(400, () => ({
      x: (Math.random() - 0.5) * 80, y: Math.random() * 40 - 10, z: 10 - Math.random() * 140,
      color: 0xcdefff, size: 2 + Math.random() * 4,
    }));
    const bub = makePoints(pos, col, siz, { opacity: 0.5, twinkle: 0.5 });
    g.add(bub.points);
    this.bubbles = bub.points;
    this.bubbleU = bub.uniforms;

    const defs = [
      { title: 'REST', sub: 'resources', accent: '#7dffb4', pos: [-9, 8, -28] },
      { title: 'GraphQL', sub: 'one query', accent: '#e535ab', pos: [10, 6, -60] },
      { title: 'WebSocket', sub: 'currents', accent: '#bdf0ff', pos: [-11, 10, -96], width: 3.8 },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(4,20,38,0.75)', width: d.width || 3.4 });
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
    this.bubbleU.uTime.value = t;
    // bubbles drift upward and wrap
    const bp = this.bubbles.geometry.attributes.position;
    const arr = bp.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += dt * (1.2 + (i % 7) * 0.15);
      if (arr[i + 1] > 30) arr[i + 1] = -12;
    }
    bp.needsUpdate = true;

    this.whale.position.y = 12 + Math.sin(t * 0.3) * 2.2;
    this.whale.rotation.z = Math.sin(t * 0.3) * 0.06;
    this.portal.rotation.z += dt * 0.4;
    this.portal.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06);
    for (let i = 0; i < this.rays.length; i++) {
      this.rays[i].material.opacity = 0.05 + (Math.sin(t * 0.6 + i) * 0.5 + 0.5) * 0.06;
    }
    for (let i = 0; i < this.fishCount; i++) {
      const f = this.fishSeed[i];
      const a = f.a + t * f.sp * 0.35;
      this._v.set(Math.cos(a) * f.r, f.y + Math.sin(t * f.sp + i) * 1.2, f.z + Math.sin(a) * f.r * 0.4);
      this._e.set(0, -a + Math.PI / 2, Math.PI / 2);
      this._q.setFromEuler(this._e);
      this._sc.setScalar(f.s);
      this._m.compose(this._v, this._q, this._sc);
      this.fish.setMatrixAt(i, this._m);
    }
    this.fish.instanceMatrix.needsUpdate = true;
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.6 + c.userData.phase) * 0.6;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
