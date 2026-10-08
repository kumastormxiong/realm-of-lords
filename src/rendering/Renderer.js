import * as THREE from '../../libs/three.module.js';

export class Renderer {
  constructor(container) {
    this.container = container || document.getElementById('canvas-container') || document.body;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));

    // High fidelity photorealistic tonemapping for Banished-style medieval atmosphere
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // High performance PCF shadow map
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.domElement = this.renderer.domElement;
    this.domElement.id = 'webgl-canvas';
    this.container.appendChild(this.domElement);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  handleResize(camera) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));

    if (camera && camera.isPerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  setExposure(val) {
    this.renderer.toneMappingExposure = val;
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    if (this.domElement && this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }
    this.renderer.dispose();
  }
}
