import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, cliffWall, glowLines, emissive, solid } from './kit.js';
import { makePanel } from '../labels.js';

// WORLD 6 — PETRA, THE BACKEND KINGDOM
export class PetraWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(320, 0x9c6244, { amp: 1.2, y: -6 }));

    // the Siq — a narrow canyon the camera threads through
    g.add(cliffWall(-1, 0xa85c3e, { height: 46, dist: 15, from: 25, to: -120 }));
    g.add(cliffWall(1, 0x944f36, { height: 42, dist: 16, from: 25, to: -120 }));

    // Al-Khazneh: the treasury, carved as the API gateway
    const facade = new THREE.Group();
    const stone = solid(0xc98a63, { roughness: 0.9 });
    const face = new THREE.Mesh(new THREE.BoxGeometry(34, 46, 3), stone);
    face.position.set(0, 17, -132);
    facade.add(face);
    for (let i = -3; i <= 3; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 22, 14), stone);
      col.position.set(i * 4.6, 5, -129);
      facade.add(col);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 4), stone);
      cap.position.set(i * 4.6, 16.5, -129);
      facade.add(cap);
    }
    // the doorway — glowing gateway
    const door = new THREE.Mesh(new THREE.PlaneGeometry(8, 16), emissive(0xffb066, 1.1));
    door.position.set(0, 5, -130.2);
    facade.add(door);
    const ped = new THREE.Mesh(new THREE.ConeGeometry(13, 12, 4), stone);
    ped.position.set(0, 44, -132); ped.rotation.y = Math.PI / 4;
    facade.add(ped);
    g.add(facade);

    // microservice nodes bridged by energy
    this.nodes = [];
    const nodePos = [
      [-13, 10, -30], [12, 14, -48], [-11, 8, -66], [14, 12, -84], [-9, 16, -100],
    ];
    for (const p of nodePos) {
      const n = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), emissive(0x6ad4ff, 1.2));
      n.position.set(...p);
      g.add(n);
      this.nodes.push(n);
    }
    const bridge = [];
    for (let i = 0; i < nodePos.length - 1; i++) bridge.push(...nodePos[i], ...nodePos[i + 1]);
    g.add(glowLines(bridge, 0x6ad4ff, 0.5));

    // floating JWT keys
    this.keys = [];
    for (let i = 0; i < 10; i++) {
      const k = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 0.25), emissive(0xffd166, 1.0));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.16, 8, 20), emissive(0xffd166, 1.0));
      ring.position.y = 1.5;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.25), emissive(0xffd166, 1.0));
      tooth.position.set(0.4, -0.9, 0);
      k.add(shaft, ring, tooth);
      k.position.set((Math.random() - 0.5) * 20, 6 + Math.random() * 12, -15 - Math.random() * 95);
      g.add(k);
      this.keys.push(k);
    }

    // REST river of light flowing along the canyon floor
    this.river = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 160),
      new THREE.MeshBasicMaterial({ color: 0x6ad4ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.river.rotation.x = -Math.PI / 2;
    this.river.position.set(0, -5.4, -55);
    g.add(this.river);

    // packets travelling the river
    this.packets = [];
    for (let i = 0; i < 24; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 1.6), emissive(0xbdf0ff, 1.4));
      p.userData.off = Math.random();
      p.userData.lane = (Math.random() - 0.5) * 5;
      g.add(p);
      this.packets.push(p);
    }

    const defs = [
      { title: 'Django', sub: 'the temple', accent: '#44b78b', pos: [-9, 13, -24] },
      { title: 'FastAPI', sub: 'the portal', accent: '#05998b', pos: [10, 9, -56] },
      { title: 'JWT', sub: 'auth doors', accent: '#ffd166', pos: [-10, 11, -90] },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(30,12,6,0.72)', width: 3.4 });
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
    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].rotation.y += dt * 0.6;
      this.nodes[i].scale.setScalar(1 + Math.sin(t * 2 + i) * 0.15);
    }
    for (let i = 0; i < this.keys.length; i++) {
      this.keys[i].rotation.y += dt * 0.7;
      this.keys[i].position.y += Math.sin(t + i) * dt * 0.6;
    }
    this.river.material.opacity = 0.14 + Math.sin(t * 1.5) * 0.05;
    for (const p of this.packets) {
      const z = 15 - ((t * 22 + p.userData.off * 140) % 150);
      p.position.set(p.userData.lane, -5.1, z);
    }
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.7 + c.userData.phase) * 0.5;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
