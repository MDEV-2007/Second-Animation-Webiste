// Hand-written GLSL for the journey. Kept dependency-free (raw ShaderMaterial).

// ---- Infinite gradient sky dome with a soft sun ----
export const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const SKY_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform float uSunInt;
  uniform float uTime;
  varying vec3 vDir;

  // cheap hash for subtle band dithering (kills banding)
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uBottom, uTop, pow(h, 0.75));

    vec3 sd = normalize(uSunDir);
    float d = max(dot(dir, sd), 0.0);
    float disc = pow(d, 380.0) * 1.2;          // sun core
    float glow = pow(d, 6.0) * 0.34;           // warm halo
    float sky  = pow(d, 1.6) * 0.09;           // wide scatter
    col += uSun * (disc + glow + sky) * uSunInt;

    // gentle horizon lift
    col += uSun * 0.03 * pow(1.0 - abs(dir.y), 6.0) * uSunInt;

    // never let the sky saturate to pure white
    col = min(col, vec3(0.95));

    col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.015; // dither
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ---- Instanced falling/floating particles (petals, leaves, embers, dust) ----
// Per-instance attributes: aSeed (vec3), aScale (float).
export const FALL_VERT = /* glsl */ `
  precision highp float;
  attribute vec3 aSeed;
  attribute float aScale;
  uniform float uTime;
  uniform float uArea;     // half-extent of the volume
  uniform float uFall;     // fall speed
  uniform float uSway;     // horizontal sway amplitude
  uniform float uSpin;     // rotation speed
  varying vec2 vUv;
  varying float vGlow;

  mat2 rot(float a){ float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }

  void main() {
    vUv = uv;
    float t = uTime;
    // wrapped vertical position (falls, loops through the volume)
    float y = mod(aSeed.y - t * uFall * (0.5 + aScale), uArea * 2.0) - uArea;
    float sway = sin(t * 0.6 + aSeed.x * 6.28) * uSway
               + cos(t * 0.31 + aSeed.z * 6.28) * uSway * 0.6;
    vec3 base = vec3(aSeed.x * uArea + sway, y, aSeed.z * uArea);

    // billboard the quad toward camera, with per-petal spin
    vec3 pos = position * aScale;
    pos.xy = rot(t * uSpin * (aScale + 0.4) + aSeed.x * 6.28) * pos.xy;
    vec4 mv = modelViewMatrix * vec4(base, 1.0);
    mv.xy += pos.xy;
    vGlow = 0.5 + 0.5 * sin(t * 2.0 + aSeed.z * 6.28);
    gl_Position = projectionMatrix * mv;
  }
`;

export const FALL_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vGlow;

  void main() {
    // soft petal/leaf shape: rounded lens
    vec2 p = vUv - 0.5;
    float r = length(p * vec2(1.0, 1.7));
    float a = smoothstep(0.5, 0.16, r);
    if (a < 0.02) discard;
    vec3 col = mix(uColorA, uColorB, vGlow);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

// ---- Soft additive point sprites (stars, embers, neurons, code particles) ----
export const POINTS_VERT = /* glsl */ `
  precision highp float;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkle;
  varying vec3 vColor;
  varying float vT;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 1.0 + uTwinkle * sin(uTime * 2.0 + position.x * 3.0 + position.y * 5.0);
    vT = tw;
    gl_Position = projectionMatrix * mv;
    // Clamp: without a ceiling, points near the camera explode to screen-filling
    // blobs and additive blending blows the whole frame out to white.
    gl_PointSize = min(aSize * uPixelRatio * tw * (300.0 / max(-mv.z, 1.0)), 48.0);
  }
`;

export const POINTS_FRAG = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vT;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    // keep the additive contribution bounded so overlapping sprites don't
    // accumulate past white
    gl_FragColor = vec4(vColor * (0.35 + 0.3 * vT), a * uOpacity);
  }
`;
