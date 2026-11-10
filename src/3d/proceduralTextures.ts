/**
 * ALLIFLY 3D Space Explorer - Procedural Canvas Textures
 * Zero external asset dependencies - generated mathematically in memory!
 */

import * as THREE from 'three';

/**
 * Creates an Earth-like planetary texture with deep blue oceans, varied landmasses, and polar ice caps
 */
export function createEarthLikeTexture(size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0c2e56');
  oceanGrad.addColorStop(0.5, '#0a4275');
  oceanGrad.addColorStop(1, '#0c2e56');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Procedural continents using noise-like sin/cos overlapping blobs
  ctx.fillStyle = '#227845'; // Lush landmass
  for (let c = 0; c < 28; c++) {
    const cx = ((c * 179 + 53) % canvas.width);
    const cy = ((c * 131 + 47) % (canvas.height * 0.7)) + canvas.height * 0.15;
    const rad = 40 + ((c * 37) % 70);

    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // Peninsula / islands
    ctx.beginPath();
    ctx.arc(cx + rad * 0.6, cy + rad * 0.4, rad * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Mountainous center
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#227845';
  }

  // Polar ice caps (North & South)
  ctx.fillStyle = '#e2f3fc';
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.08);
  ctx.fillRect(0, canvas.height * 0.92, canvas.width, canvas.height * 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Cloud layer texture with transparency
 */
export function createCloudsTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 45; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height * 0.8) + canvas.height * 0.1;
    const r = 25 + Math.random() * 65;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.5, 'rgba(240, 248, 255, 0.35)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Desert planet texture (Solara Sands)
 */
export function createDesertTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dunes and dunes striations
  for (let y = 0; y < canvas.height; y += 4) {
    const sinVal = Math.sin(y * 0.06);
    ctx.fillStyle = sinVal > 0 ? '#b45309' : '#f59e0b';
    ctx.globalAlpha = 0.35 + sinVal * 0.2;
    ctx.fillRect(0, y, canvas.width, 3);
  }
  ctx.globalAlpha = 1.0;

  // Rocky badlands
  ctx.fillStyle = '#78350f';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 15 + Math.random() * 35, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Ice planet texture (Glacies-IX)
 */
export function createIceTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glacial ice sheets
  ctx.fillStyle = '#e0f2fe';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 30 + Math.random() * 60, 0, Math.PI * 2);
    ctx.fill();
  }

  // Deep blue glacial fissures / crevasses
  ctx.strokeStyle = '#082f49';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    let cx = Math.random() * canvas.width;
    let cy = Math.random() * canvas.height;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) {
      cx += (Math.random() - 0.5) * 80;
      cy += (Math.random() - 0.5) * 60;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Volcanic planet texture (Ignis Prime)
 */
export function createVolcanicTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  // Obsidian black surface
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glowing lava fissures
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 10;

  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    let cx = Math.random() * canvas.width;
    let cy = Math.random() * canvas.height;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += (Math.random() - 0.5) * 70;
      cy += (Math.random() - 0.5) * 50;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Molten caldera lakes
  ctx.fillStyle = '#ffaa00';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 12 + Math.random() * 20, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Gas Giant banded texture (Chronos)
 */
export function createGasGiantTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  const palette = ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#9a3412', '#7c2d12'];
  
  for (let y = 0; y < canvas.height; y++) {
    const colIdx = Math.floor((y / canvas.height) * palette.length + Math.sin(y * 0.1) * 1.5);
    const safeIdx = Math.max(0, Math.min(palette.length - 1, colIdx));
    ctx.fillStyle = palette[safeIdx];
    ctx.fillRect(0, y, canvas.width, 1);
  }

  // Giant storm vortex (Great Red Spot style)
  const spotGrad = ctx.createRadialGradient(canvas.width * 0.65, canvas.height * 0.45, 5, canvas.width * 0.65, canvas.height * 0.45, 40);
  spotGrad.addColorStop(0, '#7f1d1d');
  spotGrad.addColorStop(0.7, '#b91c1c');
  spotGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(canvas.width * 0.65, canvas.height * 0.45, 45, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Planetary ring texture (rings around Chronos)
 */
export function createRingsTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < canvas.width; x++) {
    const norm = x / canvas.width;
    if (norm < 0.25 || (norm > 0.65 && norm < 0.72) || norm > 0.95) {
      // Cassini division & gaps
      continue;
    }
    const alpha = Math.sin(norm * Math.PI) * 0.75 + (Math.sin(x * 0.3) * 0.15);
    ctx.fillStyle = `rgba(234, 179, 8, ${Math.max(0, Math.min(0.9, alpha))})`;
    ctx.fillRect(x, 0, 1, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Sci-Fi Spaceship Hull Paneling Normal / Bump Map
 */
export function createHullPanelTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Plating seams
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 3;

  for (let i = 0; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Bolt rivets
  ctx.fillStyle = '#ffffff';
  for (let x = 16; x < size; x += 32) {
    for (let y = 16; y < size; y += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}
