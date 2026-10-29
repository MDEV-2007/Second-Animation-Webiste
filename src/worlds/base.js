import * as THREE from 'three';
import { worldZ } from './registry.js';
import { makePoints, pointBuffers } from '../gfx.js';

// Every world is a self-contained module. Content is built lazily in local
// space around the group origin; the group is parked at worldZ(index).
export class BaseWorld {
  constructor(def, index) {
    this.def = def;
    this.index = index;
    this.group = new THREE.Group();
    this.group.position.z = worldZ(index);
    this.group.visible = false;
    this.built = false;
    this.t = 0;
  }
  ensureBuilt() {
    if (this.built) return;
    this.build();
    this.built = true;
  }
  build() {}
  // focus: 0 centered, <0 world is ahead (approaching), >0 leaving
  update(dt, focus, globalT) { this.t += dt; }
  dispose() {}
}

// A deliberate, atmospheric "station" for disciplines not yet hand-built.
// Themed to the world's palette so the whole 18-stop journey feels intentional.
export class PlaceholderWorld extends BaseWorld {
  build() {
    const g = this.group;
    const sun = new THREE.Color().setRGB(...this.def.palette.sun, THREE.SRGBColorSpace);
    const bottom = new THREE.Color().setRGB(...this.def.palette.bottom, THREE.SRGBColorSpace);

    // reflective dark floor gives every station gravity
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(60, 64),
      new THREE.MeshStandardMaterial({ color: bottom.clone().multiplyScalar(0.22), roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4;
    g.add(floor);

    // a monolith: the discipline, waiting to become a world
    const obelisk = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 16, 1.4),
      new THREE.MeshStandardMaterial({ color: sun.clone().multiplyScalar(0.3), emissive: sun, emissiveIntensity: 0.35, roughness: 0.4 })
    );
    obelisk.position.y = 4;
    g.add(obelisk);
    this.obelisk = obelisk;

    // glowing halo ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(7, 0.06, 8, 120),
      new THREE.MeshBasicMaterial({ color: sun, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2;
    g.add(ring);
    this.ring = ring;

    // floating code shards
    this.shards = [];
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.5),
        new THREE.MeshBasicMaterial({ color: sun, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
      );
      const a = (i / 7) * Math.PI * 2;
      s.position.set(Math.cos(a) * 9, 3 + Math.sin(i) * 3, Math.sin(a) * 9);
      s.rotation.y = -a;
      g.add(s);
      this.shards.push(s);
    }

    // drifting motes in palette color — kept sparse, small and dim; additive
    // sprites stack fast and will white out the frame otherwise
    const { pos, col, siz } = pointBuffers(200, () => ({
      x: (Math.random() - 0.5) * 90,
      y: Math.random() * 34 - 4,
      z: (Math.random() - 0.5) * 90,
      color: sun.getHex(),
      size: 2 + Math.random() * 3.5,
    }));
    const { points, uniforms } = makePoints(pos, col, siz, { opacity: 0.34, twinkle: 0.6 });
    g.add(points);
    this.motes = uniforms;
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    this.motes.uTime.value = this.t;
    this.ring.rotation.z += dt * 0.15;
    this.obelisk.rotation.y += dt * 0.08;
    for (let i = 0; i < this.shards.length; i++) {
      this.shards[i].position.y += Math.sin(this.t * 0.5 + i) * dt * 0.4;
      this.shards[i].rotation.z = Math.sin(this.t * 0.3 + i) * 0.15;
    }
  }
}
