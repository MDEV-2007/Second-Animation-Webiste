import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// WORLD 17 — THE PROGRAMMING COSMOS
export class SpaceWorld extends BaseWorld {
  build() {
    const g = this.group;

    // deep starfield
    const { pos, col, siz } = pointBuffers(2600, () => {
      const r = 40 + Math.random() * 260;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      const warm = Math.random();
      return {
        x: r * Math.sin(ph) * Math.cos(th),
        y: r * Math.cos(ph) * 0.6,
        z: -60 + r * Math.sin(ph) * Math.sin(th) * 0.5,
        color: new THREE.Color().lerpColors(new THREE.Color(0x9fb4ff), new THREE.Color(0xffe9c4), warm).getHex(),
        size: 2 + Math.random() * 6,
      };
    });
    const stars = makePoints(pos, col, siz, { opacity: 1, twinkle: 0.8 });
    g.add(stars.points);
    this.stars = stars.uniforms;

    // programming planets
    this.planets = [];
    const mk = (x, y, z, r, color, emissive, label, sub, accent) => {
      const planet = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 3),
        new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.5, roughness: 0.6, flatShading: false })
      );
      planet.position.set(x, y, z);
      g.add(planet);
      const tag = makePanel({ title: label, sub, accent, width: r * 1.6, glass: 'rgba(6,8,16,0.7)' });
      tag.position.set(x, y + r + 2.2, z);
      g.add(tag);
      const obj = { planet, tag, spin: 0.1 + Math.random() * 0.3 };
      this.planets.push(obj);
      return obj;
    };

    mk(-14, 4, -20, 5, 0x1c3a5e, 0x61dafb, 'React', 'the UI star', '#61dafb');
    const py = mk(16, -2, -34, 6, 0x2a3a1a, 0xffde57, 'Python', 'ML core', '#ffde57');
    mk(-10, -6, -50, 4, 0x0e3a2e, 0x00e5ff, 'Docker', 'the moon', '#00e5ff');
    // PostgreSQL ringed planet
    const pg = mk(12, 6, -66, 5.5, 0x1e2a4a, 0x336791, 'PostgreSQL', 'ringed world', '#7fb0e0');
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(9, 0.6, 12, 80),
      new THREE.MeshStandardMaterial({ color: 0x89a7d6, emissive: 0x2a4a7a, emissiveIntensity: 0.6, roughness: 0.4 })
    );
    ring.position.copy(pg.planet.position);
    ring.rotation.x = Math.PI / 2.4;
    g.add(ring);
    this.ring = ring;

    // AI galaxy — a spiral of neurons
    const gal = pointBuffers(1400, (i) => {
      const arm = i % 2;
      const tt = (i / 1400) * Math.PI * 6;
      const rad = (i / 1400) * 16;
      const a = tt + arm * Math.PI;
      return {
        x: Math.cos(a) * rad,
        y: Math.sin(i * 0.3) * 1.5,
        z: -84 + Math.sin(a) * rad,
        color: new THREE.Color().lerpColors(new THREE.Color(0xff7ad9), new THREE.Color(0x8ea2ff), i / 1400).getHex(),
        size: 3 + Math.random() * 4,
      };
    });
    const galaxy = makePoints(gal.pos, gal.col, gal.siz, { opacity: 0.95, twinkle: 0.6 });
    galaxy.points.position.set(0, 0, 0);
    g.add(galaxy.points);
    this.galaxy = galaxy.points;
    this.galaxyU = galaxy.uniforms;
    const galTag = makePanel({ title: 'AI Galaxy', sub: 'neural spiral', accent: '#ff7ad9', width: 4, glass: 'rgba(6,8,16,0.7)' });
    galTag.position.set(0, 12, -84);
    g.add(galTag);

    // satellites exchanging API calls
    this.sats = [];
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.9), new THREE.MeshStandardMaterial({ color: 0xcfd8e8, emissive: 0x223, emissiveIntensity: 0.5 }));
      g.add(s);
      this.sats.push({ mesh: s, host: this.planets[i], radius: this.planets[i].planet.geometry.parameters.radius + 3, off: Math.random() * 6.28, speed: 0.8 + Math.random() });
    }
  }

  update(dt, focus) {
    super.update(dt, focus);
    if (!this.built) return;
    const t = this.t;
    this.stars.uTime.value = t;
    this.galaxyU.uTime.value = t;
    this.galaxy.rotation.y += dt * 0.05;
    this.ring.rotation.z += dt * 0.1;
    for (const p of this.planets) {
      p.planet.rotation.y += dt * p.spin;
      p.tag.rotation.y = Math.sin(t * 0.3) * 0.2;
    }
    for (const s of this.sats) {
      const a = t * s.speed + s.off;
      const c = s.host.planet.position;
      s.mesh.position.set(c.x + Math.cos(a) * s.radius, c.y + Math.sin(a * 0.7) * 2, c.z + Math.sin(a) * s.radius);
      s.mesh.rotation.y = -a;
    }
  }
}
