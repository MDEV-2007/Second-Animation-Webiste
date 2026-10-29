import * as THREE from 'three';
import {
  SKY_VERT, SKY_FRAG,
  FALL_VERT, FALL_FRAG,
  POINTS_VERT, POINTS_FRAG,
} from './shaders.js';

// ------- Infinite sky dome (follows camera, renders first) -------
export function makeSky() {
  const geo = new THREE.SphereGeometry(1, 40, 24);
  const uniforms = {
    uTop: { value: new THREE.Color(0x05060a) },
    uBottom: { value: new THREE.Color(0x12172b) },
    uSun: { value: new THREE.Color(0xff8a3d) },
    uSunDir: { value: new THREE.Vector3(0.1, -0.05, -1) },
    uSunInt: { value: 1.2 },
    uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(600);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  return { mesh, uniforms };
}

// ------- Instanced falling field: petals, leaves, embers, dust -------
export function makeFallingField(opts = {}) {
  const {
    count = 1200, area = 26, colorA = 0xffb7d5, colorB = 0xff7fb0,
    fall = 1.2, sway = 1.4, spin = 0.6, opacity = 0.95, size = 0.42,
  } = opts;

  const quad = new THREE.PlaneGeometry(size, size);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index;
  geo.attributes.position = quad.attributes.position;
  geo.attributes.uv = quad.attributes.uv;

  const seed = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seed[i * 3 + 0] = Math.random() * 2 - 1;
    seed[i * 3 + 1] = Math.random() * area * 2;
    seed[i * 3 + 2] = Math.random() * 2 - 1;
    scale[i] = 0.5 + Math.random() * 1.3;
  }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 3));
  geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scale, 1));
  geo.instanceCount = count;

  const uniforms = {
    uTime: { value: 0 },
    uArea: { value: area },
    uFall: { value: fall },
    uSway: { value: sway },
    uSpin: { value: spin },
    uColorA: { value: new THREE.Color(colorA) },
    uColorB: { value: new THREE.Color(colorB) },
    uOpacity: { value: opacity },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: FALL_VERT,
    fragmentShader: FALL_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// ------- Soft additive point cloud (stars, neurons, sparks) -------
export function makePoints(positions, colors, sizes, opts = {}) {
  const { opacity = 1, twinkle = 0.4, blending = THREE.AdditiveBlending } = opts;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uTwinkle: { value: twinkle },
    uOpacity: { value: opacity },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, uniforms };
}

// convenience: build point buffers from a generator
export function pointBuffers(count, gen) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const siz = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const o = gen(i);
    pos[i * 3] = o.x; pos[i * 3 + 1] = o.y; pos[i * 3 + 2] = o.z;
    c.set(o.color ?? 0xffffff);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    siz[i] = o.size ?? 6;
  }
  return { pos, col, siz };
}

// Lerp a palette colour in place.
// The palette stores sRGB components (straight from hex). three.js r152+ treats
// setRGB() input as LINEAR working space unless told otherwise, which silently
// brightened every colour — #05060a was arriving on screen as #262a38. Declaring
// SRGBColorSpace makes the conversion correct.
export function lerpColorInto(target, aArr, bArr, t) {
  target.setRGB(
    aArr[0] + (bArr[0] - aArr[0]) * t,
    aArr[1] + (bArr[1] - aArr[1]) * t,
    aArr[2] + (bArr[2] - aArr[2]) * t,
    THREE.SRGBColorSpace
  );
}
