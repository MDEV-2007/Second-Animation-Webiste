import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { emissive, solid, glowLines } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 18 — THE FUTURE LAB
// The journey ends at the desk where all of it gets built.
export class FutureLabWorld extends BaseWorld {
  build() {
    const g = this.group;

    // studio floor + soft back wall
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 620),
      new THREE.MeshStandardMaterial({ color: 0x0c1420, roughness: 0.2, metalness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -6;
    g.add(floor);

    // a ring of holographic monitors arcing around the visitor
    this.monitors = [];
    const projects = [
      { title: 'AI ArtCAM', sub: 'image → DXF · CNC', accent: '#00e5ff' },
      { title: 'AgentLab HQ', sub: '16 tools · 5 agents', accent: '#7dffb4' },
      { title: 'IlmMevasi', sub: 'learning platform', accent: '#ffd166' },
      { title: 'ODYSSEY', sub: 'webgl portfolio', accent: '#ff7ad9' },
      { title: 'World of Code', sub: 'you are here', accent: '#ffffff' },
    ];
    projects.forEach((p, i) => {
      const a = (i - (projects.length - 1) / 2) * 0.42;
      const r = 17;
      const m = makePanel({
        title: p.title, sub: p.sub, accent: p.accent,
        glass: 'rgba(6,16,26,0.72)', width: 6.4, ratio: 0.58,
      });
      m.position.set(Math.sin(a) * r, 4.5 + Math.cos(i * 1.3) * 1.6, -22 - Math.cos(a) * r * 0.5);
      m.rotation.y = -a;
      m.userData.base = m.position.y;
      m.userData.phase = i * 1.1;
      g.add(m);
      this.monitors.push(m);
      // frame glow
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(6.7, 6.7 * 0.58 + 0.2),
        emissive(p.accent, 0.5, { transparent: true, opacity: 0.16, side: THREE.DoubleSide })
      );
      frame.position.copy(m.position);
      frame.position.z -= 0.06;
      frame.rotation.y = m.rotation.y;
      g.add(frame);
    });

    // the desk
    const deskMat = solid(0x1a2433, { roughness: 0.5, flatShading: false });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 6), deskMat);
    desk.position.set(0, -1.5, -8);
    g.add(desk);
    for (const sx of [-7, 7]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 0.4), deskMat);
      leg.position.set(sx, -3.8, -8);
      g.add(leg);
    }

    // mechanical keyboard with per-key backlight
    this.keys = [];
    const kbBase = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 2.2), solid(0x0f1620, { roughness: 0.6 }));
    kbBase.position.set(0, -1.1, -7);
    g.add(kbBase);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 14; c++) {
        const k = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.34), emissive(0x00e5ff, 0.5));
        k.position.set(-2.9 + c * 0.44, -0.92, -7.7 + r * 0.46);
        g.add(k);
        this.keys.push({ mesh: k, off: Math.random() * 6.28 });
      }
    }

    // ambient light rig above the desk
    const rig = [];
    for (let i = 0; i < 6; i++) {
      const x = -12 + i * 4.8;
      rig.push(x, 14, -14, x, 14, -34);
    }
    g.add(glowLines(rig, 0x00e5ff, 0.22));

    // a slowly rotating globe of everything travelled
    this.globe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.4, 2),
      new THREE.MeshStandardMaterial({ color: 0x123048, emissive: 0x00e5ff, emissiveIntensity: 0.4, roughness: 0.4, wireframe: true })
    );
    this.globe.position.set(0, 13, -40);
    g.add(this.globe);

    // data motes in the air
    const { pos, col, siz } = pointBuffers(360, () => ({
      x: (Math.random() - 0.5) * 60, y: -5 + Math.random() * 28, z: 5 - Math.random() * 70,
      color: Math.random() < 0.6 ? 0x00e5ff : 0x7dffb4, size: 2 + Math.random() * 3,
    }));
    const motes = makePoints(pos, col, siz, { opacity: 0.45, twinkle: 0.8 });
    g.add(motes.points);
    this.motes = motes.uniforms;

    // closing line
    const outro = makePanel({
      title: "Let's build something", sub: 'the journey continues →',
      accent: '#ffffff', glass: 'rgba(4,10,18,0.8)', width: 9, ratio: 0.34, dot: false, align: 'center',
    });
    outro.position.set(0, 20, -56);
    g.add(outro);
    this.outro = outro;
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.motes.uTime.value = t;
    this.globe.rotation.y += dt * 0.18;
    this.globe.rotation.x += dt * 0.05;
    for (const m of this.monitors) {
      m.position.y = m.userData.base + Math.sin(t * 0.5 + m.userData.phase) * 0.35;
    }
    // keys type themselves
    for (const k of this.keys) {
      const pressed = Math.sin(t * 6 + k.off) > 0.94;
      k.mesh.position.y = -0.92 - (pressed ? 0.06 : 0);
      k.mesh.material.emissiveIntensity = pressed ? 1.8 : 0.35 + Math.sin(t * 1.5 + k.off) * 0.2;
    }
    this.outro.position.y = 20 + Math.sin(t * 0.4) * 0.5;
  }
}
