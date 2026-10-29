import * as THREE from 'three';
import { BaseWorld } from './base.js';
import { ground, emissive, solid } from './kit.js';
import { makePoints, pointBuffers } from '../gfx.js';
import { makePanel } from '../labels.js';

// Falling water: a scrolling, streaked curtain
const WATER_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  void main() {
    // vertical streaks scrolling downward
    float lane = floor(vUv.x * 90.0);
    float speed = 0.6 + hash(vec2(lane, 1.0)) * 0.9;
    float y = fract(vUv.y + uTime * speed);
    float streak = smoothstep(0.55, 1.0, hash(vec2(lane, floor(y * 14.0))));
    vec3 col = mix(uBottom, uTop, vUv.y);
    col += streak * 0.35;
    float a = 0.55 + streak * 0.35;
    a *= smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
    gl_FragColor = vec4(col, a);
  }
`;
const WATER_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// WORLD 13 — THE FALLS OF DATA FLOW
export class NiagaraWorld extends BaseWorld {
  build() {
    const g = this.group;
    g.add(ground(320, 0x1f5f7a, { amp: 1.2, y: -14 }));

    // cliff shelf the water pours from
    const rock = solid(0x4a5a63, { roughness: 1 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(120, 30, 26), rock);
    shelf.position.set(0, 1, -96);
    g.add(shelf);

    // the falls
    this.waterU = {
      uTime: { value: 0 },
      uTop: { value: new THREE.Color(0xdff6ff) },
      uBottom: { value: new THREE.Color(0x4aa8c9) },
    };
    const falls = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 44),
      new THREE.ShaderMaterial({
        vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, uniforms: this.waterU,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    falls.position.set(0, -6, -83);
    g.add(falls);

    // side falls
    const side = falls.clone();
    side.material = falls.material;
    side.scale.set(0.45, 0.8, 1);
    side.position.set(-46, -9, -70);
    side.rotation.y = 0.9;
    g.add(side);

    // river below, flowing toward the camera
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 180),
      new THREE.MeshStandardMaterial({ color: 0x2b86ad, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.85 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -13.6, -20);
    g.add(river);

    // mist at the base
    const { pos, col, siz } = pointBuffers(700, () => ({
      x: (Math.random() - 0.5) * 110,
      y: -14 + Math.random() * 22,
      z: -60 - Math.random() * 40,
      color: 0xdff6ff,
      size: 5 + Math.random() * 9,
    }));
    const mist = makePoints(pos, col, siz, { opacity: 0.16, twinkle: 0.3 });
    g.add(mist.points);
    this.mistU = mist.uniforms;

    // event packets riding the river — Kafka, RabbitMQ, Redis
    this.packets = [];
    const colors = [0xffd166, 0xff6b4a, 0x7dffb4];
    for (let i = 0; i < 60; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 2.2), emissive(colors[i % 3], 1.2));
      p.userData.off = Math.random();
      p.userData.lane = (Math.random() - 0.5) * 60;
      g.add(p);
      this.packets.push(p);
    }

    const defs = [
      { title: 'Kafka', sub: 'the torrent', accent: '#ffd166', pos: [-15, 6, -34] },
      { title: 'RabbitMQ', sub: 'queues', accent: '#ff6b4a', pos: [16, 9, -54] },
      { title: 'Redis Streams', sub: 'in memory', accent: '#7dffb4', pos: [-14, 12, -70], width: 4.4 },
    ];
    this.cards = defs.map((d) => {
      const c = makePanel({ title: d.title, sub: d.sub, accent: d.accent, glass: 'rgba(4,22,32,0.78)', width: d.width || 3.4 });
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
    this.waterU.uTime.value = t;
    this.mistU.uTime.value = t;
    for (const p of this.packets) {
      const z = -60 + ((t * 20 + p.userData.off * 90) % 90);
      p.position.set(p.userData.lane, -13.2, z);
      p.rotation.z = Math.sin(t + p.userData.off * 6) * 0.2;
    }
    for (const c of this.cards) {
      c.position.y = c.userData.base + Math.sin(t * 0.7 + c.userData.phase) * 0.5;
      c.rotation.y = Math.sin(t * 0.3 + c.userData.phase) * 0.2;
    }
  }
}
