import * as THREE from '../../libs/three.module.js';
import { SimplexNoise } from './Noise.js';
import { TextureGenerator } from './TextureGenerator.js';

export class FoliageManager {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.noise = new SimplexNoise(888);

    this.windTime = 0;
    this.customMaterials = [];

    this.treeData = [];
    this.harvestableResources = [];

    this.leafTex = TextureGenerator.createLeafClusterTexture();
    this.pineTex = TextureGenerator.createPineBranchTexture();
    this.flowerTex = TextureGenerator.createFlowerTexture();
    this.oakBarkTex = TextureGenerator.createOakBarkTexture();
    this.birchBarkTex = TextureGenerator.createBirchBarkTexture();

    this.initMeadowGrass();
    this.initWildflowers();
    this.initOakForest();
    this.initPineForest();
    this.initBirchTrees();
    this.initFruitTrees();
    this.initBerryBushes();
    this.initMineralOreMines();
    this.initForestRocks();
  }

  applyWindShader(material, swayStrength = 0.25, heightFactor = 0.6, frequency = 2.0) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = { value: 0 };
      shader.uniforms.uSwayStrength = { value: swayStrength };
      shader.uniforms.uHeightFactor = { value: heightFactor };
      shader.uniforms.uFrequency = { value: frequency };

      shader.vertexShader = `
        uniform float uWindTime;
        uniform float uSwayStrength;
        uniform float uHeightFactor;
        uniform float uFrequency;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float windWave = sin(uWindTime * uFrequency + position.x * 0.35 + position.z * 0.35);
        float microGust = sin(uWindTime * (uFrequency * 2.3) + position.x * 0.8) * 0.25;
        float hWeight = max(0.0, position.y * uHeightFactor);
        
        float totalSway = (windWave + microGust) * uSwayStrength * hWeight;
        transformed.x += totalSway;
        transformed.z += cos(uWindTime * (uFrequency * 0.8) + position.z * 0.4) * (uSwayStrength * 0.6) * hWeight;
        `
      );

      this.customMaterials.push({ material, shader });
    };
  }

  initMeadowGrass() {
    const grassCount = 10000;
    const geom = new THREE.BufferGeometry();
    const w = 0.6;
    const h = 0.38;
    const vertices = new Float32Array([
      -w / 2, 0, 0,   w / 2, 0, 0,   w / 2, h, 0,
      -w / 2, 0, 0,   w / 2, h, 0,  -w / 2, h, 0,
      0, 0, -w / 2,   0, 0, w / 2,   0, h, w / 2,
      0, 0, -w / 2,   0, h, w / 2,   0, h, -w / 2
    ]);
    const uvs = new Float32Array([
      0, 0, 1, 0, 1, 1,  0, 0, 1, 1, 0, 1,
      0, 0, 1, 0, 1, 1,  0, 0, 1, 1, 0, 1
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x5a872a,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    this.applyWindShader(mat, 0.3, 0.8, 2.0);

    this.grassMesh = new THREE.InstancedMesh(geom, mat, grassCount);
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const grassColors = [0x4d7522, 0x62912c, 0x3e5e1b, 0x6ea133, 0x558026];

    let valid = 0;
    for (let i = 0; i < grassCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * 175;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = this.terrain.getHeight(x, z);
      if (y > this.terrain.waterLevel + 0.3 && y < 11.5) {
        dummy.position.set(x, y, z);
        const s = 0.5 + Math.random() * 0.35;
        dummy.scale.set(s, s * (0.8 + Math.random() * 0.4), s);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();

        this.grassMesh.setMatrixAt(valid, dummy.matrix);
        color.setHex(grassColors[Math.floor(Math.random() * grassColors.length)]);
        this.grassMesh.setColorAt(valid, color);
        valid++;
      }
    }

    this.grassMesh.count = valid;
    this.grassMesh.instanceMatrix.needsUpdate = true;
    if (this.grassMesh.instanceColor) this.grassMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.grassMesh);
  }

  initWildflowers() {
    const flowerCount = 2000;
    const geom = new THREE.PlaneGeometry(0.35, 0.35);
    geom.rotateX(-Math.PI * 0.25);

    const mat = new THREE.MeshStandardMaterial({
      map: this.flowerTex,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    this.applyWindShader(mat, 0.25, 0.9, 2.5);

    this.flowerMesh = new THREE.InstancedMesh(geom, mat, flowerCount);
    this.flowerMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let valid = 0;

    for (let i = 0; i < flowerCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.pow(Math.random(), 0.7) * 140;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = this.terrain.getHeight(x, z);
      if (y > this.terrain.waterLevel + 0.4 && y < 9.5) {
        dummy.position.set(x, y + 0.18, z);
        const s = 0.6 + Math.random() * 0.4;
        dummy.scale.set(s, s, s);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();

        this.flowerMesh.setMatrixAt(valid, dummy.matrix);
        valid++;
      }
    }

    this.flowerMesh.count = valid;
    this.flowerMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.flowerMesh);
  }

  initFruitTrees() {
    const fruitTreeCount = 55;
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.55, 3.2, 7);
    trunkGeom.translate(0, 1.6, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ map: this.oakBarkTex, roughness: 0.9 });
    const canopyGeom = new THREE.DodecahedronGeometry(1.8, 1);
    canopyGeom.translate(0, 3.2, 0);

    const leafMat = new THREE.MeshStandardMaterial({
      map: this.leafTex,
      color: 0x4d7522,
      roughness: 0.7,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });
    this.applyWindShader(leafMat, 0.2, 0.35, 1.8);

    const appleGeom = new THREE.SphereGeometry(0.12, 6, 6);
    const appleMat = new THREE.MeshStandardMaterial({ color: 0xc92222, roughness: 0.3 });

    this.fruitTreeTrunks = new THREE.InstancedMesh(trunkGeom, trunkMat, fruitTreeCount);
    this.fruitTreeCanopies = new THREE.InstancedMesh(canopyGeom, leafMat, fruitTreeCount);
    this.fruitTreeTrunks.castShadow = true;
    this.fruitTreeCanopies.castShadow = true;

    const dummy = new THREE.Object3D();
    const appleGroup = new THREE.Group();
    let count = 0;

    for (let i = 0; i < fruitTreeCount * 2 && count < fruitTreeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 85;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = this.terrain.getHeight(x, z);
      if (y > this.terrain.waterLevel + 0.6 && y < 10) {
        dummy.position.set(x, y, z);
        const s = 0.85 + Math.random() * 0.3;
        dummy.scale.set(s, s, s);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();

        this.fruitTreeTrunks.setMatrixAt(count, dummy.matrix);
        this.fruitTreeCanopies.setMatrixAt(count, dummy.matrix);

        for (let a = 0; a < 5; a++) {
          const apple = new THREE.Mesh(appleGeom, appleMat);
          const theta = Math.random() * Math.PI * 2;
          const r = 1.0 + Math.random() * 0.5;
          apple.position.set(x + Math.cos(theta) * r, y + 2.5 + Math.random() * 1.0, z + Math.sin(theta) * r);
          appleGroup.add(apple);
        }

        this.harvestableResources.push({
          type: 'FRUIT_TREE',
          position: new THREE.Vector3(x, y, z),
          food: 40,
          alive: true
        });

        count++;
      }
    }

    this.fruitTreeTrunks.count = count;
    this.fruitTreeCanopies.count = count;
    this.fruitTreeTrunks.instanceMatrix.needsUpdate = true;
    this.fruitTreeCanopies.instanceMatrix.needsUpdate = true;

    this.scene.add(this.fruitTreeTrunks);
    this.scene.add(this.fruitTreeCanopies);
    this.scene.add(appleGroup);
  }

  initBerryBushes() {
    const bushCount = 70;
    const geom = new THREE.DodecahedronGeometry(0.9, 1);
    const mat = new THREE.MeshStandardMaterial({
      map: this.leafTex,
      color: 0x3d6621,
      roughness: 0.8,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });
    this.applyWindShader(mat, 0.25, 0.6, 2.0);

    this.berryBushMesh = new THREE.InstancedMesh(geom, mat, bushCount);
    this.berryBushMesh.castShadow = true;

    const berryDotGeom = new THREE.SphereGeometry(0.08, 5, 5);
    const berryRedMat = new THREE.MeshStandardMaterial({ color: 0xdb2727, roughness: 0.4 });
    const berryBlueMat = new THREE.MeshStandardMaterial({ color: 0x2b429e, roughness: 0.4 });

    const berriesCluster = new THREE.Group();
    const dummy = new THREE.Object3D();
    let count = 0;

    for (let i = 0; i < bushCount * 2 && count < bushCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 95;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = this.terrain.getHeight(x, z);
      if (y > this.terrain.waterLevel + 0.4 && y < 10) {
        dummy.position.set(x, y + 0.35, z);
        const s = 0.75 + Math.random() * 0.45;
        dummy.scale.set(s * 1.2, s * 0.75, s * 1.2);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();

        this.berryBushMesh.setMatrixAt(count, dummy.matrix);

        const isRed = Math.random() > 0.5;
        for (let b = 0; b < 4; b++) {
          const berry = new THREE.Mesh(berryDotGeom, isRed ? berryRedMat : berryBlueMat);
          berry.position.set(x + (Math.random() - 0.5) * 0.8, y + 0.5 + Math.random() * 0.4, z + (Math.random() - 0.5) * 0.8);
          berriesCluster.add(berry);
        }

        this.harvestableResources.push({
          type: 'BERRY',
          position: new THREE.Vector3(x, y, z),
          food: 20,
          alive: true
        });

        count++;
      }
    }

    this.berryBushMesh.count = count;
    this.berryBushMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.berryBushMesh);
    this.scene.add(berriesCluster);
  }

  initMineralOreMines() {
    const mineCount = 35;
    const geom = new THREE.DodecahedronGeometry(1.6, 1);
    const stoneTex = TextureGenerator.createStoneTexture();
    const matIronOre = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color: 0x8a6345,
      roughness: 0.7,
      metalness: 0.5,
      flatShading: true
    });

    this.oreMesh = new THREE.InstancedMesh(geom, matIronOre, mineCount);
    this.oreMesh.castShadow = true;
    this.oreMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let count = 0;

    for (let i = 0; i < mineCount * 2 && count < mineCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 110;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const y = this.terrain.getHeight(x, z);
      if (y > this.terrain.waterLevel + 1.2) {
        dummy.position.set(x, y + 0.6, z);
        const sx = 0.9 + Math.random() * 1.2;
        const sy = 0.7 + Math.random() * 0.9;
        const sz = 0.9 + Math.random() * 1.2;
        dummy.scale.set(sx, sy, sz);
        dummy.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
        dummy.updateMatrix();

        this.oreMesh.setMatrixAt(count, dummy.matrix);

        this.harvestableResources.push({
          type: 'IRON_ORE',
          position: new THREE.Vector3(x, y, z),
          stone: 80,
          iron: 40,
          alive: true
        });

        count++;
      }
    }

    this.oreMesh.count = count;
    this.oreMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.oreMesh);
  }

  initOakForest() {
    const oakCount = 260;
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.75, 4.0, 8);
    trunkGeom.translate(0, 2.0, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ map: this.oakBarkTex, roughness: 0.92 });
    const leafGeom1 = new THREE.DodecahedronGeometry(2.4, 1);
    leafGeom1.translate(0, 4.2, 0);
    const leafGeom2 = new THREE.DodecahedronGeometry(1.9, 1);
    leafGeom2.translate(1.1, 5.2, 0.6);

    const leafMat = new THREE.MeshStandardMaterial({
      map: this.leafTex,
      color: 0x436d23,
      roughness: 0.7,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });
    this.applyWindShader(leafMat, 0.22, 0.35, 1.8);

    this.oakTrunkMesh = new THREE.InstancedMesh(trunkGeom, trunkMat, oakCount);
    this.oakCanopy1 = new THREE.InstancedMesh(leafGeom1, leafMat, oakCount);
    this.oakCanopy2 = new THREE.InstancedMesh(leafGeom2, leafMat, oakCount);
    this.oakTrunkMesh.castShadow = true;
    this.oakCanopy1.castShadow = true;
    this.oakCanopy2.castShadow = true;

    const dummy = new THREE.Object3D();
    let count = 0;

    for (let i = 0; i < oakCount * 2 && count < oakCount; i++) {
      const x = (Math.random() - 0.5) * 350;
      const z = (Math.random() - 0.5) * 350;
      const dCenter = Math.hypot(x, z);

      const n = this.noise.noise2D(x * 0.012, z * 0.012);
      if (dCenter > 38 && n > -0.15) {
        const y = this.terrain.getHeight(x, z);
        if (y > this.terrain.waterLevel + 0.8 && y < 14) {
          dummy.position.set(x, y, z);
          const s = 0.85 + Math.random() * 0.5;
          dummy.scale.set(s, s * (0.9 + Math.random() * 0.3), s);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          dummy.updateMatrix();

          this.oakTrunkMesh.setMatrixAt(count, dummy.matrix);
          this.oakCanopy1.setMatrixAt(count, dummy.matrix);
          this.oakCanopy2.setMatrixAt(count, dummy.matrix);

          this.treeData.push({
            type: 'oak',
            index: count,
            position: new THREE.Vector3(x, y, z),
            wood: 50,
            alive: true
          });

          count++;
        }
      }
    }

    this.oakTrunkMesh.count = count;
    this.oakCanopy1.count = count;
    this.oakCanopy2.count = count;
    this.oakTrunkMesh.instanceMatrix.needsUpdate = true;
    this.oakCanopy1.instanceMatrix.needsUpdate = true;
    this.oakCanopy2.instanceMatrix.needsUpdate = true;

    this.scene.add(this.oakTrunkMesh);
    this.scene.add(this.oakCanopy1);
    this.scene.add(this.oakCanopy2);
  }

  initPineForest() {
    const pineCount = 280;
    const trunkGeom = new THREE.CylinderGeometry(0.2, 0.45, 4.8, 7);
    trunkGeom.translate(0, 2.4, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ map: this.oakBarkTex, roughness: 0.95 });
    const tier1 = new THREE.ConeGeometry(2.4, 3.0, 7);
    tier1.translate(0, 3.8, 0);
    const tier2 = new THREE.ConeGeometry(1.8, 2.8, 7);
    tier2.translate(0, 5.8, 0);

    const pineMat = new THREE.MeshStandardMaterial({
      map: this.pineTex,
      color: 0x1f4625,
      roughness: 0.75,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });
    this.applyWindShader(pineMat, 0.18, 0.2, 1.5);

    this.pineTrunkMesh = new THREE.InstancedMesh(trunkGeom, trunkMat, pineCount);
    this.pineTier1 = new THREE.InstancedMesh(tier1, pineMat, pineCount);
    this.pineTier2 = new THREE.InstancedMesh(tier2, pineMat, pineCount);
    this.pineTrunkMesh.castShadow = true;
    this.pineTier1.castShadow = true;
    this.pineTier2.castShadow = true;

    const dummy = new THREE.Object3D();
    let count = 0;

    for (let i = 0; i < pineCount * 2 && count < pineCount; i++) {
      const x = (Math.random() - 0.5) * 380;
      const z = (Math.random() - 0.5) * 380;
      const dCenter = Math.hypot(x, z);

      const n = this.noise.noise2D(x * 0.015 + 20, z * 0.015 + 20);
      if (dCenter > 45 && n > -0.2) {
        const y = this.terrain.getHeight(x, z);
        if (y > this.terrain.waterLevel + 1.2) {
          dummy.position.set(x, y, z);
          const s = 0.8 + Math.random() * 0.6;
          dummy.scale.set(s, s * (1.0 + Math.random() * 0.4), s);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          dummy.updateMatrix();

          this.pineTrunkMesh.setMatrixAt(count, dummy.matrix);
          this.pineTier1.setMatrixAt(count, dummy.matrix);
          this.pineTier2.setMatrixAt(count, dummy.matrix);

          this.treeData.push({
            type: 'pine',
            index: count,
            position: new THREE.Vector3(x, y, z),
            wood: 45,
            alive: true
          });

          count++;
        }
      }
    }

    this.pineTrunkMesh.count = count;
    this.pineTier1.count = count;
    this.pineTier2.count = count;
    this.pineTrunkMesh.instanceMatrix.needsUpdate = true;
    this.pineTier1.instanceMatrix.needsUpdate = true;
    this.pineTier2.instanceMatrix.needsUpdate = true;

    this.scene.add(this.pineTrunkMesh);
    this.scene.add(this.pineTier1);
    this.scene.add(this.pineTier2);
  }

  initBirchTrees() {
    const birchCount = 160;
    const trunkGeom = new THREE.CylinderGeometry(0.18, 0.3, 5.0, 7);
    trunkGeom.translate(0, 2.5, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ map: this.birchBarkTex, roughness: 0.8 });
    const canopyGeom = new THREE.DodecahedronGeometry(1.8, 1);
    canopyGeom.translate(0, 4.8, 0);

    const leafMat = new THREE.MeshStandardMaterial({
      map: this.leafTex,
      color: 0x739e33,
      roughness: 0.65,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });
    this.applyWindShader(leafMat, 0.3, 0.4, 2.2);

    this.birchTrunkMesh = new THREE.InstancedMesh(trunkGeom, trunkMat, birchCount);
    this.birchCanopyMesh = new THREE.InstancedMesh(canopyGeom, leafMat, birchCount);
    this.birchTrunkMesh.castShadow = true;
    this.birchCanopyMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    let count = 0;

    for (let i = 0; i < birchCount * 2 && count < birchCount; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      const dCenter = Math.hypot(x, z);

      const n = this.noise.noise2D(x * 0.02 - 15, z * 0.02 - 15);
      if (dCenter > 25 && n > 0.0) {
        const y = this.terrain.getHeight(x, z);
        if (y > this.terrain.waterLevel + 0.6 && y < 12) {
          dummy.position.set(x, y, z);
          const s = 0.85 + Math.random() * 0.4;
          dummy.scale.set(s, s * (1.0 + Math.random() * 0.3), s);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          dummy.updateMatrix();

          this.birchTrunkMesh.setMatrixAt(count, dummy.matrix);
          this.birchCanopyMesh.setMatrixAt(count, dummy.matrix);

          this.treeData.push({
            type: 'birch',
            index: count,
            position: new THREE.Vector3(x, y, z),
            wood: 35,
            alive: true
          });

          count++;
        }
      }
    }

    this.birchTrunkMesh.count = count;
    this.birchCanopyMesh.count = count;
    this.birchTrunkMesh.instanceMatrix.needsUpdate = true;
    this.birchCanopyMesh.instanceMatrix.needsUpdate = true;

    this.scene.add(this.birchTrunkMesh);
    this.scene.add(this.birchCanopyMesh);
  }

  initForestRocks() {
    const rockCount = 120;
    const geom = new THREE.DodecahedronGeometry(1.4, 1);
    const stoneTex = TextureGenerator.createStoneTexture();
    const mat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9, flatShading: true });

    this.rockMesh = new THREE.InstancedMesh(geom, mat, rockCount);
    this.rockMesh.castShadow = true;
    this.rockMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let count = 0;

    for (let i = 0; i < rockCount * 2 && count < rockCount; i++) {
      const x = (Math.random() - 0.5) * 340;
      const z = (Math.random() - 0.5) * 340;
      const y = this.terrain.getHeight(x, z);

      if (y > this.terrain.waterLevel + 0.3) {
        dummy.position.set(x, y + 0.4, z);
        const sx = 0.7 + Math.random() * 1.5;
        const sy = 0.4 + Math.random() * 0.8;
        const sz = 0.7 + Math.random() * 1.5;
        dummy.scale.set(sx, sy, sz);
        dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        dummy.updateMatrix();

        this.rockMesh.setMatrixAt(count, dummy.matrix);
        count++;
      }
    }

    this.rockMesh.count = count;
    this.rockMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.rockMesh);
  }

  update(delta) {
    this.windTime += delta;
    for (const item of this.customMaterials) {
      if (item.shader.uniforms.uWindTime) {
        item.shader.uniforms.uWindTime.value = this.windTime;
      }
    }
  }
}
