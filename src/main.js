import './style.css';
import { Experience } from './Experience.js';
import { initUI } from './ui.js';

function boot() {
  try {
    const exp = new Experience();
    initUI(exp);
    // expose for debugging
    window.__WORLD = exp;
  } catch (e) {
    console.error('Failed to launch THE WORLD OF CODE:', e);
    document.body.innerHTML = `<div style="position:fixed;inset:0;display:grid;place-items:center;background:#05060a;color:#f4f1e9;font-family:sans-serif;text-align:center;padding:2rem">
      <div><h1 style="font-weight:400;letter-spacing:.1em">THE WORLD OF CODE</h1>
      <p style="opacity:.6;margin-top:1rem">This experience needs a WebGL-capable browser.</p></div></div>`;
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
