import * as THREE from '../../libs/three.module.js';
import { SimplexNoise } from './Noise.js';
import { TextureGenerator } from './TextureGenerator.js';

export class Terrain {
  constructor(scene, size = 400, segments = 180) {
    this.scene = scene;
    this.size = size;
    this.segments = segments;
    this.noise = new SimplexNoise(42);
    this.roads = new Set();

    this.waterLevel = 1.6;
    this.init();
  }

  getHeight(x, z) {
    const dCenter = Math.hypot(x, z);
    const flatFactor = Math.min(1.0, Math.pow(dCenter / 140, 1.8));
    const baseElevation = 3.8;

    const hills = this.noise.fbm(x * 0.005, z * 0.005, 4, 2.0, 0.5) * 18.0;
    const detail = this.noise.noise2D(x * 0.02, z * 0.02) * 1.2;

    const riverZ = Math.sin(x * 0.016) * 45 + 50;
    const distToRiver = Math.abs(z - riverZ);
    let riverCarve = 0;
    if (distToRiver < 16) {
      const riverDepth = (1 - Math.cos((distToRiver / 16) * Math.PI)) * 0.5;
      riverCarve = (1 - riverDepth) * 3.2;
    }

    return baseElevation + (hills * flatFactor + detail) - riverCarve;
  }

  getElevation(x, z) {
    return this.getHeight(x, z);
  }

  init() {
    const geom = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const count = pos.count;
    this.originalColors = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cGrass = new THREE.Color(0x567e30);
    const cLush = new THREE.Color(0x456e22);
    const cSand = new THREE.Color(0xa39367);
    const cRock = new THREE.Color(0x737068);
    const cDarkSoil = new THREE.Color(0x423824);

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeight(x, z);
      pos.setY(i, y);

      const riverZ = Math.sin(x * 0.016) * 45 + 50;
      const distToRiver = Math.abs(z - riverZ);

      let col = cGrass.clone();
      if (distToRiver < 11) {
        col.lerp(cSand, 1.0 - distToRiver / 11);
      } else if (y > 11) {
        col.lerp(cRock, Math.min(1.0, (y - 11) / 8));
      } else {
        const n = this.noise.noise2D(x * 0.04, z * 0.04);
        if (n > 0.2) col.lerp(cLush, n);
        else if (n < -0.3) col.lerp(cDarkSoil, Math.abs(n) * 0.6);
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      this.originalColors[i * 3] = col.r;
      this.originalColors[i * 3 + 1] = col.g;
      this.originalColors[i * 3 + 2] = col.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const grassTex = TextureGenerator.createGrassTexture();
    grassTex.repeat.set(45, 45);

    this.terrainMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.02
    });

    this.mesh = new THREE.Mesh(geom, this.terrainMat);
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.createRiver();
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);
  }

  createRiver() {
    const riverSegments = 160;
    const riverGeom = new THREE.PlaneGeometry(this.size, 26, riverSegments, 4);
    riverGeom.rotateX(-Math.PI / 2);

    const pos = riverGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const zOffset = pos.getZ(i);
      const riverCenterZ = Math.sin(x * 0.016) * 45 + 50;
      pos.setZ(i, riverCenterZ + zOffset);
      pos.setY(i, this.waterLevel);
    }
    riverGeom.computeVertexNormals();

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b7782,
      transmission: 0.5,
      opacity: 0.88,
      transparent: true,
      roughness: 0.25,
      metalness: 0.05,
      reflectivity: 0.4
    });

    this.waterMesh = new THREE.Mesh(riverGeom, waterMat);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  isWater(x, z) {
    const h = this.getHeight(x, z);
    return h < this.waterLevel + 0.2;
  }

  addRoad(gx, gz) {
    const key = `${gx},${gz}`;
    if (this.roads.has(key)) return false;
    this.roads.add(key);

    const y = this.getHeight(gx, gz) + 0.08;
    const geom = new THREE.PlaneGeometry(3.6, 3.6);
    geom.rotateX(-Math.PI / 2);

    const pathTex = TextureGenerator.createDirtPathTexture();
    pathTex.repeat.set(2, 2);

    const mat = new THREE.MeshStandardMaterial({
      map: pathTex,
      roughness: 0.95,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0
    });

    const roadMesh = new THREE.Mesh(geom, mat);
    roadMesh.position.set(gx, y, gz);
    roadMesh.receiveShadow = true;
    this.roadGroup.add(roadMesh);
    return true;
  }

  hasRoad(gx, gz) {
    return this.roads.has(`${gx},${gz}`);
  }

  update(time, snowCoverage = 0) {
    if (this.waterMesh) {
      this.waterMesh.position.y = this.waterLevel + Math.sin(time * 1.5) * 0.03;
    }

    // Apply winter snow accumulation to terrain colors
    if (this.mesh && this.originalColors) {
      const colAttr = this.mesh.geometry.attributes.color;
      const count = colAttr.count;
      const snowColor = new THREE.Color(0xf2f7fa);

      if (snowCoverage > 0.05) {
        for (let i = 0; i < count; i++) {
          const r = this.originalColors[i * 3];
          const g = this.originalColors[i * 3 + 1];
          const b = this.originalColors[i * 3 + 2];

          colAttr.setXYZ(
            i,
            THREE.MathUtils.lerp(r, snowColor.r, snowCoverage * 0.9),
            THREE.MathUtils.lerp(g, snowColor.g, snowCoverage * 0.9),
            THREE.MathUtils.lerp(b, snowColor.b, snowCoverage * 0.9)
          );
        }
        colAttr.needsUpdate = true;
      }
    }
  }
}
