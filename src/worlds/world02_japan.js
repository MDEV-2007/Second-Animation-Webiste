import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { makeFallingField } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 2 — JAPAN, THE SAKURA OF FRONTEND
export class JapanWorld extends BaseWorld {
  build() {
    const g = this.group;

    // rolling ground
    const ground = rollingGround(600, 600, 0x8fbf72, 90);
    ground.position.y = -3;
    g.add(ground);

    // Mt. Fuji far away
    const fuji = new THREE.Mesh(
      new THREE.ConeGeometry(70, 60, 48, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x6b7a95, roughness: 1, flatShading: true })
    );
    fuji.position.set(-30, 27, -150);
    g.add(fuji);
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(26, 24, 48),
      new THREE.MeshStandardMaterial({ color: 0xf3f6ff, roughness: 0.8, flatShading: true })
    );
    cap.position.set(-30, 45, -150);
    g.add(cap);

    // Torii gate the camera flies through
    const torii = buildTorii();
    torii.position.set(0, 0, 6);
    g.add(torii);

    // Sakura trees scattered along the path
    this.trees = [];
    const spots = [
      [-14, -22], [12, -30], [-20, -46], [18, -52], [-10, -66], [22, -74],
      [-26, -90], [8, -96], [-16, -110], [20, -118], [-6, 2], [16, -6],
    ];
    for (const [x, z] of spots) {
      const tr = buildSakuraTree();
      tr.position.set(x, -3, z);
      tr.scale.setScalar(0.9 + Math.random() * 0.7);
      tr.rotation.y = Math.random() * Math.PI;
      g.add(tr);
      this.trees.push(tr);
    }

    // The signature: a storm of sakura petals
    const petals = makeFallingField({
      count: 2200, area: 34, colorA: 0xffd3e6, colorB: 0xff8fc0,
      fall: 1.0, sway: 2.0, spin: 0.7, opacity: 0.95, size: 0.5,
    });
    petals.mesh.position.y = 6;
    g.add(petals.mesh);
    this.petals = petals.uniforms;

    // Floating UI components — the frontend stack, blooming in the air
    this.cards = [];
    const cardDefs = [
      { title: 'React', sub: 'components', accent: '#61dafb', pos: [-8, 6, -14] },
      { title: 'Next.js', sub: 'app router', accent: '#ffffff', glass: 'rgba(8,10,14,0.7)', pos: [9, 8, -22] },
      { title: 'TypeScript', sub: 'type-safe', accent: '#3178c6', pos: [-11, 9, -34] },
      { title: 'Tailwind', sub: 'utility-first', accent: '#38bdf8', pos: [6, 5.5, -44] },
      { title: '<Button/>', sub: 'onClick', accent: '#a78bfa', mono: true, pos: [-6, 4.5, -58] },
      { title: 'useState()', sub: 'hooks', accent: '#f0abfc', mono: true, pos: [12, 7, -66] },
      { title: 'Three.js', sub: 'webgl', accent: '#7dffb4', pos: [-14, 6.5, -80] },
    ];
    for (const d of cardDefs) {
      const card = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: d.glass, mono: d.mono, width: 3.4 });
      card.position.set(...d.pos);
      card.userData.base = d.pos[1];
      card.userData.phase = Math.random() * Math.PI * 2;
      g.add(card);
      this.cards.push(card);
    }

    // the fox's glowing JavaScript trail near the ground
    this.fox = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffcf3d })
    );
    g.add(this.fox);
    this.trail = [];
    for (let i = 0; i < 16; i++) {
      const t = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xf7d048, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      g.add(t);
      this.trail.push(t);
    }
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.petals.uTime.value = t;

    // trees sway
    for (let i = 0; i < this.trees.length; i++) {
      this.trees[i].rotation.z = Math.sin(t * 0.5 + i) * 0.02;
    }
    // cards bob + face camera-ish
    for (const card of this.cards) {
      card.position.y = card.userData.base + Math.sin(t * 0.8 + card.userData.phase) * 0.5;
      card.rotation.y = Math.sin(t * 0.3 + card.userData.phase) * 0.25;
    }
    // fox runs a looping path, dropping a glowing trail
    const fx = Math.sin(t * 0.5) * 20;
    const fz = -40 + Math.cos(t * 0.5) * 34;
    this.fox.position.set(fx, -2.4, fz);
    for (let i = 0; i < this.trail.length; i++) {
      const tt = t - (i + 1) * 0.08;
      this.trail[i].position.set(Math.sin(tt * 0.5) * 20, -2.5, -40 + Math.cos(tt * 0.5) * 34);
      this.trail[i].material.opacity = 0.5 * (1 - i / this.trail.length);
    }
  }
}

// ---- local builders ----
function rollingGround(w, h, color, seg) {
  const geo = new THREE.PlaneGeometry(w, h, seg, seg);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const z = Math.sin(x * 0.06) * 1.6 + Math.cos(y * 0.05) * 1.8 + Math.sin((x + y) * 0.03) * 1.2;
    p.setZ(i, z);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }));
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function buildTorii() {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xd7263d, roughness: 0.6, metalness: 0.1 });
  const pillarGeo = new THREE.CylinderGeometry(0.6, 0.75, 16, 16);
  const l = new THREE.Mesh(pillarGeo, red); l.position.set(-6, 5, 0);
  const r = new THREE.Mesh(pillarGeo, red); r.position.set(6, 5, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(17, 1.1, 1.6), red); top.position.set(0, 13.2, 0); top.rotation.z = 0.02;
  const top2 = new THREE.Mesh(new THREE.BoxGeometry(15, 0.8, 1.2), red); top2.position.set(0, 11.4, 0);
  const black = new THREE.Mesh(new THREE.BoxGeometry(18.5, 1.4, 1.9), new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.7 }));
  black.position.set(0, 14.2, 0);
  g.add(l, r, top, top2, black);
  return g;
}

function buildSakuraTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.6, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0x5a3d33, roughness: 1, flatShading: true })
  );
  trunk.position.y = 3;
  g.add(trunk);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffc0d8, roughness: 0.9, emissive: 0x552036, emissiveIntensity: 0.25, flatShading: true });
  const blobs = [[0, 7, 0, 3.2], [-2, 6.4, 1, 2.2], [2.2, 6.6, -0.6, 2.4], [0.4, 8.2, -1.4, 2.0], [-1.4, 8, 1.4, 1.8]];
  for (const [x, y, z, r] of blobs) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), canopyMat);
    b.position.set(x, y, z);
    g.add(b);
  }
  return g;
}
