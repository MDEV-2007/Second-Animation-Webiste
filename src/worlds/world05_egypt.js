import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { makePanel } from '../labels.js';

// WORLD 5 — EGYPT, THE PYRAMIDS OF DATABASES
export class EgyptWorld extends BaseWorld {
  build() {
    const g = this.group;

    // rolling golden desert
    const geo = new THREE.PlaneGeometry(620, 620, 80, 80);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setZ(i, Math.sin(x * 0.04) * 2.5 + Math.cos(y * 0.05) * 2.2);
    }
    geo.computeVertexNormals();
    const desert = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xe0b271, roughness: 1, flatShading: true }));
    desert.rotation.x = -Math.PI / 2;
    desert.position.y = -4;
    g.add(desert);

    // pyramids (4-sided cones)
    const sand = new THREE.MeshStandardMaterial({ color: 0xd6a860, roughness: 1, flatShading: true });
    const pyr = (x, z, s) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.1, 4), sand);
      m.position.set(x, s * 0.55 - 4, z);
      m.rotation.y = Math.PI / 4;
      g.add(m);
      return m;
    };
    pyr(-24, -70, 34);
    pyr(22, -95, 40);
    this.mainPyr = pyr(0, -55, 30);
    // glowing SQL core revealed inside the main pyramid
    this.core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4, 1),
      new THREE.MeshStandardMaterial({ color: 0x336791, emissive: 0x336791, emissiveIntensity: 1.4, roughness: 0.2 })
    );
    this.core.position.set(0, 6, -55);
    g.add(this.core);

    // floating PostgreSQL tables
    this.tables = [];
    const tdefs = [
      { title: 'users', rows: ['id  PK', 'email', 'created_at'], pos: [-9, 7, -20] },
      { title: 'orders', rows: ['id  PK', 'user_id  FK', 'total', 'status'], pos: [9, 9, -30] },
      { title: 'products', rows: ['id  PK', 'name', 'price'], pos: [-7, 5, -40] },
    ];
    for (const d of tdefs) {
      const panel = makePanel({ title: d.title, rows: d.rows, accent: '#ffd98a', glass: 'rgba(10,8,4,0.72)', width: 3.4, ratio: 0.7 });
      panel.position.set(...d.pos);
      panel.userData.base = d.pos[1];
      panel.userData.phase = Math.random() * 6.28;
      g.add(panel);
      this.tables.push(panel);
    }
    // relationship lines between tables
    const rp = [
      ...this.tables[0].position.toArray(), ...this.tables[1].position.toArray(),
      ...this.tables[1].position.toArray(), ...this.tables[2].position.toArray(),
    ];
    const rgeo = new THREE.BufferGeometry();
    rgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rp), 3));
    g.add(new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.5 })));

    // Redis memory crystals
    this.crystals = [];
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.7, 0),
        new THREE.MeshStandardMaterial({ color: 0xff4438, emissive: 0xff2a1e, emissiveIntensity: 1.1, roughness: 0.2 })
      );
      const a = (i / 9) * Math.PI * 2;
      c.position.set(Math.cos(a) * 12, 4 + Math.sin(i) * 3, -45 + Math.sin(a) * 8);
      g.add(c);
      this.crystals.push(c);
    }

    // queries flying through the tunnel
    this.queries = [];
    for (let i = 0; i < 20; i++) {
      const q = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 1.4),
        new THREE.MeshBasicMaterial({ color: 0x7dffb4, blending: THREE.AdditiveBlending })
      );
      q.userData.off = Math.random();
      q.userData.lane = (Math.random() - 0.5) * 6;
      g.add(q);
      this.queries.push(q);
    }
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.core.rotation.y += dt * 0.5;
    this.core.rotation.x += dt * 0.2;
    for (const tb of this.tables) {
      tb.position.y = tb.userData.base + Math.sin(t * 0.7 + tb.userData.phase) * 0.4;
      tb.rotation.y = Math.sin(t * 0.3 + tb.userData.phase) * 0.2;
    }
    for (let i = 0; i < this.crystals.length; i++) {
      this.crystals[i].rotation.y += dt * 0.8;
      this.crystals[i].position.y = 4 + Math.sin(t * 1.2 + i) * 1.2;
    }
    for (const q of this.queries) {
      const z = 10 - ((t * 12 + q.userData.off * 60) % 70);
      q.position.set(q.userData.lane, 5, z);
    }
  }
}
