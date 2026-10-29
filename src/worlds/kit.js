import * as THREE from 'three';

// Shared builders used across worlds. Keeping these here stops every world
// module from re-inventing terrain, glow lines and emissive materials.

export function emissive(color, intensity = 0.8, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.35),
    emissive: color,
    emissiveIntensity: intensity,
    roughness: opts.roughness ?? 0.4,
    metalness: opts.metalness ?? 0,
    ...opts,
  });
}

export function solid(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 1, flatShading: opts.flatShading ?? true, ...opts,
  });
}

// Rolling displaced ground plane
export function ground(size, color, opts = {}) {
  const { seg = 60, amp = 2.5, freq = 0.04, y = -4 } = opts;
  // The plane's far edge must sit beyond scene.fog.far (235) or it draws a hard
  // horizon line across the shot. Half-extent >= 280 keeps the edge in the haze.
  size = Math.max(size, 600);
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), v = p.getY(i);
    p.setZ(i, Math.sin(x * freq) * amp + Math.cos(v * freq * 1.2) * amp * 0.9 + Math.sin((x + v) * freq * 0.6) * amp * 0.5);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, solid(color, opts.mat));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

// Glowing line segments from a flat [x,y,z, x,y,z, ...] array
export function glowLines(points, color, opacity = 0.55, additive = true) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  }));
}

// A jagged cliff / mountain wall running along -Z. side = -1 (left) or 1 (right)
export function cliffWall(side, color, opts = {}) {
  const { from = 20, to = -150, step = 10, height = 40, dist = 16, jag = 5 } = opts;
  const g = new THREE.Group();
  const mat = solid(color);
  for (let z = from; z > to; z -= step) {
    const h = height + Math.sin(z * 0.11) * jag + Math.random() * jag;
    const w = step * 1.25 + Math.random() * 3;
    const d = dist + Math.sin(z * 0.07) * 3;
    const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, step * 1.3), mat);
    block.position.set(side * d, h / 2 - 6, z);
    block.rotation.y = (Math.random() - 0.5) * 0.15;
    g.add(block);
  }
  return g;
}

// Simple conifer / canopy tree
export function tree(trunkColor, leafColor, opts = {}) {
  const { h = 14, r = 3.4, blobs = 4 } = opts;
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.2, h, 8), solid(trunkColor));
  trunk.position.y = h / 2;
  g.add(trunk);
  const leafMat = solid(leafColor, { roughness: 0.9 });
  for (let i = 0; i < blobs; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (1 - i * 0.16), 1), leafMat);
    b.position.set((Math.random() - 0.5) * r * 0.7, h + i * r * 0.55, (Math.random() - 0.5) * r * 0.7);
    g.add(b);
  }
  return g;
}

// Scatter helper: calls fn(x, z, i) for n positions along the corridor,
// keeping a clear central path of half-width `clear`.
export function scatter(n, opts, fn) {
  const { spread = 34, from = 10, to = -140, clear = 7 } = opts;
  for (let i = 0; i < n; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (clear + Math.random() * spread);
    const z = from + (to - from) * (i / n) + (Math.random() - 0.5) * 8;
    fn(x, z, i);
  }
}
