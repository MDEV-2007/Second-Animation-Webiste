import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, glowLines, emissive, solid } from './kit.js';
import { makeFallingField } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 10 — THE ALPS OF SYSTEM DESIGN
export class AlpsWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(340, 0xd8e6f2, { amp: 3, y: -6 }));

    // snowy peaks
    const rock = solid(0x6b7f96, { roughness: 1 });
    const snow = solid(0xf2f8ff, { roughness: 0.85 });
    const peak = (x, z, r, h) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), rock);
      m.position.set(x, h / 2 - 6, z);
      m.rotation.y = Math.random() * 3;
      g.add(m);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.42, h * 0.34, 5), snow);
      cap.position.set(x, h * 0.83 - 6, z);
      cap.rotation.y = m.rotation.y;
      g.add(cap);
    };
    peak(-46, -70, 38, 66); peak(40, -95, 44, 78); peak(-30, -130, 34, 58);
    peak(58, -45, 26, 44); peak(0, -160, 50, 88);

    // microservice villages clinging to the slopes
    this.villages = [];
    const vpos = [[-20, 4, -34], [18, 8, -58], [-16, 12, -86], [22, 6, -110]];
    for (const p of vpos) {
      const v = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const hut = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), solid(0x8a5a3c));
        hut.position.set((Math.random() - 0.5) * 6, Math.random() * 0.6, (Math.random() - 0.5) * 6);
        v.add(hut);
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), emissive(0xffd166, 1.4));
        win.position.set(hut.position.x, hut.position.y, hut.position.z + 0.82);
        v.add(win);
      }
      v.position.set(...p);
      g.add(v);
      this.villages.push(v);
    }

    // cable cars = API calls between services
    const wires = [];
    for (let i = 0; i < vpos.length - 1; i++) wires.push(...vpos[i], ...vpos[i + 1]);
    g.add(glowLines(wires, 0x7dd8ff, 0.5, false));
    this.cars = [];
    for (let i = 0; i < vpos.length - 1; i++) {
      const car = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.1), emissive(0xff8a3d, 1.0));
      car.userData.a = new THREE.Vector3(...vpos[i]);
      car.userData.b = new THREE.Vector3(...vpos[i + 1]);
      car.userData.off = i * 0.3;
      g.add(car);
      this.cars.push(car);
    }

    // Kubernetes clusters as clouds overhead
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Mesh(
        new THREE.IcosahedronGeometry(4 + Math.random() * 3, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.55, flatShading: true })
      );
      c.position.set((Math.random() - 0.5) * 90, 30 + Math.random() * 14, 5 - Math.random() * 150);
      c.scale.set(2.2, 0.7, 1.4);
      g.add(c);
      this.clouds.push(c);
    }

    // falling snow
    const snowfall = makeFallingField({
      count: 1400, area: 32, colorA: 0xffffff, colorB: 0xdcecff,
      fall: 1.1, sway: 1.6, spin: 0.3, opacity: 0.8, size: 0.22,
    });
    snowfall.mesh.position.y = 12;
    g.add(snowfall.mesh);
    this.snow = snowfall.uniforms;

    const defs = [
      { title: 'Load Balancer', sub: 'the bridge', accent: '#7dd8ff', pos: [-10, 14, -44], width: 4.4 },
      { title: 'Kubernetes', sub: 'clusters above', accent: '#326ce5', pos: [11, 18, -78], width: 4 },
      { title: 'Scalability', sub: 'peak by peak', accent: '#f2f8ff', pos: [-9, 16, -112], width: 4 },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(12,24,38,0.7)', width: d.width });
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
    this.snow.uTime.value = t;
    for (let i = 0; i < this.clouds.length; i++) {
      this.clouds[i].position.x += dt * (0.6 + i * 0.05);
      if (this.clouds[i].position.x > 55) this.clouds[i].position.x = -55;
    }
    for (const car of this.cars) {
      const k = (Math.sin(t * 0.4 + car.userData.off) * 0.5 + 0.5);
      car.position.lerpVectors(car.userData.a, car.userData.b, k);
      car.position.y += 0.6;
    }
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.6 + c.userData.phase) * 0.5;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
