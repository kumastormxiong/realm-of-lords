import * as THREE from '../../libs/three.module.js';

export class TextureGenerator {
  static createLeafClusterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 512);

    const leafColors = ['#436d24', '#385e1d', '#52822d', '#2f5018', '#649938', '#4b7328'];
    const count = 350;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6) * 210;
      const cx = 256 + Math.cos(angle) * r;
      const cy = 256 + Math.sin(angle) * r;

      const leafLen = 14 + Math.random() * 22;
      const leafWidth = leafLen * 0.55;
      const leafAngle = angle + (Math.random() - 0.5) * 1.5;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(leafAngle);

      ctx.beginPath();
      ctx.moveTo(0, -leafLen / 2);
      ctx.quadraticCurveTo(leafWidth, 0, 0, leafLen / 2);
      ctx.quadraticCurveTo(-leafWidth, 0, 0, -leafLen / 2);

      ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
      ctx.fill();

      ctx.strokeStyle = 'rgba(25, 45, 12, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -leafLen / 2);
      ctx.lineTo(0, leafLen / 2);
      ctx.stroke();

      ctx.restore();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  static createPineBranchTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    ctx.strokeStyle = '#382515';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 240);
    ctx.lineTo(128, 20);
    ctx.stroke();

    const needleColors = ['#1d3b20', '#254a29', '#152c17', '#2e5a33', '#396b3f'];
    for (let y = 240; y > 30; y -= 3) {
      const branchWidth = (y / 240) * 85 + 15;
      for (let side = -1; side <= 1; side += 2) {
        const angle = (side * Math.PI) / 4 + (Math.random() - 0.5) * 0.3;
        const len = branchWidth * (0.6 + Math.random() * 0.4);

        ctx.strokeStyle = needleColors[Math.floor(Math.random() * needleColors.length)];
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(128, y);
        ctx.lineTo(128 + Math.cos(angle) * len * side, y - Math.sin(Math.abs(angle)) * len);
        ctx.stroke();
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  static createFlowerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    // Daisy
    ctx.save();
    ctx.translate(64, 64);
    for (let i = 0; i < 12; i++) {
      ctx.rotate((Math.PI * 2) / 12);
      ctx.fillStyle = '#f5f7f2';
      ctx.beginPath();
      ctx.ellipse(0, 24, 6, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e5a522';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Red Poppy
    ctx.save();
    ctx.translate(192, 64);
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.fillStyle = '#c72424';
      ctx.beginPath();
      ctx.arc(0, 22, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#1c1515';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Buttercup
    ctx.save();
    ctx.translate(64, 192);
    for (let i = 0; i < 8; i++) {
      ctx.rotate((Math.PI * 2) / 8);
      ctx.fillStyle = '#e8b82a';
      ctx.beginPath();
      ctx.ellipse(0, 20, 8, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8f5713';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bluebell
    ctx.save();
    ctx.translate(192, 192);
    for (let i = 0; i < 6; i++) {
      ctx.rotate((Math.PI * 2) / 6);
      ctx.fillStyle = '#4963ba';
      ctx.beginPath();
      ctx.ellipse(0, 22, 7, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#27366b';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  static createOakBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#433123';
    ctx.fillRect(0, 0, 512, 512);

    for (let x = 0; x < 512; x += 4) {
      const shade = 35 + Math.sin(x * 0.15) * 15 + (Math.random() - 0.5) * 15;
      ctx.fillStyle = `rgb(${shade + 15}, ${shade + 8}, ${shade})`;
      ctx.fillRect(x, 0, 4, 512);
    }
    for (let i = 0; i < 250; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const h = 20 + Math.random() * 60;
      ctx.fillStyle = 'rgba(25, 16, 10, 0.7)';
      ctx.fillRect(x, y, 2 + Math.random() * 3, h);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static createBirchBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dcd8cf';
    ctx.fillRect(0, 0, 256, 512);

    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 512;
      const w = 4 + Math.random() * 22;
      const h = 1.5 + Math.random() * 2.5;
      ctx.fillStyle = 'rgba(30, 28, 25, 0.85)';
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#4d7027');
    grad.addColorStop(0.5, '#426320');
    grad.addColorStop(1, '#375219');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 3 + Math.random() * 8;
      const angle = Math.random() * Math.PI;
      const colors = ['#5e8a2e', '#3a571a', '#6da235', '#496c22', '#2f4415'];
      ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#5c5c58';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16, cols = 8;
    const h = 512 / rows, w = 512 / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (w / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * w + offset;
        const y = r * h;
        const val = 85 + Math.floor(Math.random() * 45);
        ctx.fillStyle = `rgb(${val - 4}, ${val}, ${val - 3})`;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        ctx.strokeStyle = '#343532';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a3219';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 3) {
      const a = 0.15 + Math.sin(y * 0.12) * 0.1;
      ctx.fillStyle = `rgba(25, 14, 8, ${a})`;
      ctx.fillRect(0, y, 256, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static createThatchRoofTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#7a6435';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const len = 12 + Math.random() * 24;
      const shades = ['#947b42', '#6b5428', '#aa8f50', '#5c4620'];
      ctx.strokeStyle = shades[Math.floor(Math.random() * shades.length)];
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 5, y + len);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static createDirtPathTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#59442b';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = Math.random() * 2.2;
      const shades = ['#49351e', '#6e5436', '#3e2c17', '#7b5f3f'];
      ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
}
