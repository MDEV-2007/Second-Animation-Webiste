import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { makePanel } from '../labels.js';

// WORLD 3 — THE GREAT WALL OF ALGORITHMS
export class GreatWallWorld extends BaseWorld {
  build() {
    const g = this.group;

    // mountainous ground
    const geo = new THREE.PlaneGeometry(620, 620, 90, 90);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const z = Math.sin(x * 0.03) * 8 + Math.cos(y * 0.025) * 9 + Math.sin((x + y) * 0.05) * 3;
      p.setZ(i, z - Math.abs(x) * 0.02);
    }
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8a9a6b, roughness: 1, flatShading: true }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    g.add(ground);

    // the wall, receding into the distance
    const stone = new THREE.MeshStandardMaterial({ color: 0xb7a888, roughness: 1, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x8f8064, roughness: 1, flatShading: true });
    this.wallY = (z) => Math.sin(z * 0.05) * 2.2;
    for (let z = 12; z > -150; z -= 6) {
      const y = this.wallY(z);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 6.2), stone);
      seg.position.set(0, y, z);
      g.add(seg);
      // crenellations
      for (let cx = -3.2; cx <= 3.2; cx += 1.6) {
        const cr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 6.2), dark);
        cr.position.set(cx, y + 3.2, z);
        g.add(cr);
      }
    }
    // watchtowers — alternating to either side so the flight path stays clear
    this.towers = [];
    let side = 1;
    for (let z = -10; z > -150; z -= 34) {
      const tx = side * 10.5;
      side *= -1;
      const tw = new THREE.Mesh(new THREE.BoxGeometry(11, 15, 11), stone);
      tw.position.set(tx, this.wallY(z) + 2, z);
      g.add(tw);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12.5, 1.2, 12.5), dark);
      roof.position.set(tx, this.wallY(z) + 10, z);
      g.add(roof);
      this.towers.push(tw);
    }

    // sorting bars — algorithms become waterfalls of light
    this.bars = [];
    const barMat = () => new THREE.MeshStandardMaterial({ color: 0x39c6ff, emissive: 0x1466aa, emissiveIntensity: 0.9, roughness: 0.4 });
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1, 0.9), barMat());
      b.position.set(18 + (i % 11) * 1.2, 0, -20 - Math.floor(i / 11) * 3);
      g.add(b);
      this.bars.push(b);
    }

    // binary tree literally growing from the ground
    this.treeNodes = [];
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0x7dffb4, emissive: 0x1f7a4d, emissiveIntensity: 1.0, roughness: 0.3 });
    const positions = [
      [-20, 12, -30], [-25, 8, -34], [-15, 8, -34],
      [-28, 4, -38], [-22, 4, -38], [-18, 4, -38], [-12, 4, -38],
    ];
    const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
    for (const pos of positions) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), nodeMat);
      n.position.set(...pos);
      g.add(n);
      this.treeNodes.push(n);
    }
    const linePts = [];
    for (const [a, b] of edges) { linePts.push(...positions[a], ...positions[b]); }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePts), 3));
    g.add(new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: 0x7dffb4, transparent: true, opacity: 0.6 })));

    // graph edges connecting tower tops (glowing)
    const gp = [];
    for (let i = 0; i < this.towers.length - 1; i++) {
      const a = this.towers[i].position, b = this.towers[i + 1].position;
      gp.push(a.x, a.y + 8, a.z, b.x - 20, b.y + 14, b.z, b.x - 20, b.y + 14, b.z, b.x, b.y + 8, b.z);
    }
    const ggeo = new THREE.BufferGeometry();
    ggeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gp), 3));
    g.add(new THREE.LineSegments(ggeo, new THREE.LineBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending })));

    // a panda solving LeetCode
    g.add(buildPanda(-6, -2, 4));
    const screen = makePanel({ title: 'LeetCode', sub: '#1 Two Sum ✓', accent: '#ffd98a', width: 2.6, glass: 'rgba(8,10,14,0.8)' });
    screen.position.set(-3.2, 1.5, 5);
    screen.rotation.y = 0.5;
    g.add(screen);
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    // animated sort — bars rise and fall like a waterfall of light
    for (let i = 0; i < this.bars.length; i++) {
      const h = 2 + (Math.sin(t * 1.5 + i * 0.6) * 0.5 + 0.5) * 8;
      this.bars[i].scale.y = h;
      this.bars[i].position.y = h / 2 - 2;
    }
    // tree nodes pulse
    for (let i = 0; i < this.treeNodes.length; i++) {
      const s = 1 + Math.sin(t * 2 + i) * 0.12;
      this.treeNodes[i].scale.setScalar(s);
    }
  }
}

function buildPanda(x, y, z) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 1, flatShading: true });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1, flatShading: true });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), white); body.position.y = 1.4;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), white); head.position.y = 3;
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), black); e1.position.set(-0.7, 3.9, 0.1);
  const e2 = e1.clone(); e2.position.x = 0.7;
  const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), black); p1.position.set(-0.4, 3.05, 0.85);
  const p2 = p1.clone(); p2.position.x = 0.4;
  const a1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), black); a1.position.set(-1.1, 1.4, 0.7);
  const a2 = a1.clone(); a2.position.x = 1.1;
  g.add(body, head, e1, e2, p1, p2, a1, a2);
  g.position.set(x, y, z);
  return g;
}
