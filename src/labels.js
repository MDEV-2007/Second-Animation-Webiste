import * as THREE from 'three';

// Draw a crisp glassmorphic panel to a canvas and return a textured plane.
// Reused for floating UI cards (Japan), SQL tables (Egypt), holograms, etc.
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makePanel(opts = {}) {
  const {
    title = '', sub = '', accent = '#7dffb4', glass = 'rgba(12,16,26,0.55)',
    fg = '#f4f1e9', width = 3.2, ratio = 0.58, dot = true, mono = false,
    align = 'left', rows = null, border = 0.9,
  } = opts;

  const W = 640, H = Math.round(640 * ratio);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');

  // glass body
  c.fillStyle = glass;
  roundRect(c, 14, 14, W - 28, H - 28, 34); c.fill();
  // subtle top sheen
  const grad = c.createLinearGradient(0, 14, 0, H);
  grad.addColorStop(0, 'rgba(255,255,255,0.12)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  c.fillStyle = grad;
  roundRect(c, 14, 14, W - 28, H - 28, 34); c.fill();
  // border
  c.lineWidth = 3;
  c.strokeStyle = accent;
  c.globalAlpha = border;
  roundRect(c, 14, 14, W - 28, H - 28, 34); c.stroke();
  c.globalAlpha = 1;

  if (dot) {
    c.fillStyle = accent;
    c.beginPath(); c.arc(52, 56, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(244,241,233,0.35)';
    c.beginPath(); c.arc(86, 56, 7, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(114, 56, 7, 0, Math.PI * 2); c.fill();
  }

  if (rows) {
    // table-style rows (used for DB tables)
    c.textAlign = 'left';
    c.font = '600 30px "JetBrains Mono", monospace';
    c.fillStyle = accent;
    c.fillText(title, 44, 118);
    c.font = '400 26px "JetBrains Mono", monospace';
    rows.forEach((r, i) => {
      c.fillStyle = i % 2 ? 'rgba(244,241,233,0.55)' : 'rgba(244,241,233,0.85)';
      c.fillText(r, 44, 168 + i * 44);
    });
  } else {
    c.textAlign = align === 'center' ? 'center' : 'left';
    const tx = align === 'center' ? W / 2 : 48;
    c.fillStyle = fg;
    c.font = mono ? '600 66px "JetBrains Mono", monospace' : '500 74px "Space Grotesk", sans-serif';
    c.fillText(title, tx, H * 0.56);
    if (sub) {
      c.fillStyle = accent;
      c.font = '500 30px "JetBrains Mono", monospace';
      c.fillText(sub, tx, H * 0.78);
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * ratio), mat);
  mesh.userData.tex = tex;
  return mesh;
}
