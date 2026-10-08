import * as THREE from '../../libs/three.module.js';
import { BUILDING_TYPES } from '../core/Constants.js';
import { TextureGenerator } from '../environment/TextureGenerator.js';
import { globalEvents } from '../core/EventBus.js';

export class BuildingManager {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    this.buildings = [];
    this.smokeParticles = [];

    // Future 3D Model hook (set to true when user loads .glb files into assets/models/)
    this.useExternal3DModels = false;
    this.loadedExternalModels = new Map();

    this.initSharedMaterials();
  }

  initSharedMaterials() {
    this.woodTex = TextureGenerator.createWoodTexture();
    this.stoneTex = TextureGenerator.createStoneTexture();
    this.thatchTex = TextureGenerator.createThatchRoofTexture();

    this.matWood = new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.85 });
    this.matStone = new THREE.MeshStandardMaterial({ map: this.stoneTex, roughness: 0.9 });
    this.matThatch = new THREE.MeshStandardMaterial({ map: this.thatchTex, roughness: 0.95 });
    this.matPlaster = new THREE.MeshStandardMaterial({ color: 0xdecbb5, roughness: 0.9 });
    this.matPlasterDark = new THREE.MeshStandardMaterial({ color: 0xcaa382, roughness: 0.95 });
    this.matIron = new THREE.MeshStandardMaterial({ color: 0x3d3e42, roughness: 0.4, metalness: 0.8 });
    this.matAnvil = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.3, metalness: 0.9 });
    this.matFabricRed = new THREE.MeshStandardMaterial({ color: 0x8b1e1e, roughness: 0.7 });
    this.matFabricGold = new THREE.MeshStandardMaterial({ color: 0xc8962c, roughness: 0.6 });
    this.matWheat = new THREE.MeshStandardMaterial({ color: 0xd4a742, roughness: 0.8 });
    this.matRiceGreen = new THREE.MeshStandardMaterial({ color: 0x488a2c, roughness: 0.7 });
    this.matVeggieGreen = new THREE.MeshStandardMaterial({ color: 0x3d7a2f, roughness: 0.85 });
    this.matBerryRuby = new THREE.MeshStandardMaterial({ color: 0xb51c1c, roughness: 0.5 });
  }

  addBuilding(typeKey, x, z, rotation = 0) {
    return this.build(typeKey, x, z, rotation);
  }

  build(typeKey, x, z, rotation = 0) {
    const key = (typeof typeKey === 'string') ? typeKey.toUpperCase() : '';
    const config = BUILDING_TYPES[key];
    if (!config) {
      console.warn(`[BuildingManager] Unknown building type: ${typeKey}`);
      return null;
    }

    const y = this.terrain ? this.terrain.getHeight(x, z) : 3.8;
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotation;

    let updateData = {
      type: key.toLowerCase(),
      typeKey: key,
      config,
      x, z, y,
      position: new THREE.Vector3(x, y, z),
      group,
      mesh: group,
      doorPos: null,
      interiorPos: null,
      cropType: 'WHEAT'
    };

    switch (key) {
      case 'OUTPOST':
        this.constructOutpost(group, updateData);
        break;
      case 'COTTAGE':
        this.constructEnterableCottage(group, updateData);
        break;
      case 'LUMBER':
        this.constructLumber(group, updateData);
        break;
      case 'WOODCUTTER':
        this.constructWoodcutter(group, updateData);
        break;
      case 'BLACKSMITH':
        this.constructBlacksmith(group, updateData);
        break;
      case 'FARM':
        this.constructInteractiveFarm(group, updateData);
        break;
      case 'QUARRY':
        this.constructQuarry(group, updateData);
        break;
      case 'WELL':
        this.constructWell(group, updateData);
        break;
      case 'GRANARY':
        this.constructGranary(group, updateData);
        break;
      case 'MANOR':
        this.constructManor(group, updateData);
        break;
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(group);
    this.buildings.push(updateData);
    globalEvents.emit('buildingConstructed', updateData);
    return updateData;
  }

  // 1. Enterable Cottage with Hearth
  constructEnterableCottage(group, data) {
    const w = 3.6 + (Math.random() - 0.5) * 0.8;
    const d = 3.2 + (Math.random() - 0.5) * 0.8;
    const h = 2.4 + (Math.random() - 0.5) * 0.4;
    const wallThick = 0.25;

    // Floor & Foundation
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), this.matWood);
    floor.position.y = 0.1;
    group.add(floor);

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3), this.matStone);
    foundation.position.y = -0.15;
    group.add(foundation);

    // Walls with open doorway
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.matPlaster);
    wallL.position.set(-w / 2 + wallThick / 2, h / 2 + 0.2, 0);
    group.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.matPlaster);
    wallR.position.set(w / 2 - wallThick / 2, h / 2 + 0.2, 0);
    group.add(wallR);

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallThick), this.matPlaster);
    wallBack.position.set(0, h / 2 + 0.2, -d / 2 + wallThick / 2);
    group.add(wallBack);

    const doorW = 1.0;
    const sideW = (w - doorW) / 2;
    const frontL = new THREE.Mesh(new THREE.BoxGeometry(sideW, h, wallThick), this.matPlaster);
    frontL.position.set(-doorW / 2 - sideW / 2, h / 2 + 0.2, d / 2 - wallThick / 2);
    group.add(frontL);

    const frontR = new THREE.Mesh(new THREE.BoxGeometry(sideW, h, wallThick), this.matPlaster);
    frontR.position.set(doorW / 2 + sideW / 2, h / 2 + 0.2, d / 2 - wallThick / 2);
    group.add(frontR);

    // Thatched Roof
    const roofH = 2.0;
    const roofGeom = new THREE.ConeGeometry((w + 1.2) * 0.65, roofH, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeom, this.matThatch);
    roof.position.y = h + roofH / 2 + 0.1;
    roof.scale.set(w / (w * 0.9), 1.0, d / (d * 0.9));
    group.add(roof);

    // Hearth & Cozy Fire
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.5), this.matStone);
    hearth.position.set(0, 0.6, -d / 2 + 0.45);
    group.add(hearth);

    const hearthLight = new THREE.PointLight(0xff7722, 1.4, 7);
    hearthLight.position.set(0, 0.8, -d / 2 + 0.7);
    group.add(hearthLight);

    // Furniture
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.6), this.matWood);
    table.position.set(-0.7, 0.35, 0.1);
    group.add(table);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.65, h + roofH + 0.8, 0.65), this.matStone);
    chimney.position.set(0, (h + roofH) / 2, -d / 2 + 0.45);
    group.add(chimney);

    data.chimneyPos = new THREE.Vector3(group.position.x, group.position.y + h + roofH + 0.6, group.position.z - d / 2 + 0.45);
    data.interiorPos = new THREE.Vector3(group.position.x, group.position.y + 0.2, group.position.z);
    data.doorPos = new THREE.Vector3(group.position.x, group.position.y + 0.2, group.position.z + d / 2);
  }

  // 2. Banished Woodcutter (劈柴工坊)
  constructWoodcutter(group, data) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 3.2), this.matWood);
    floor.position.y = 0.1;
    group.add(floor);

    // Open shelter roof on timber pillars
    const postGeom = new THREE.CylinderGeometry(0.18, 0.18, 2.4, 6);
    [[-1.6, -1.3], [1.6, -1.3], [-1.6, 1.3], [1.6, 1.3]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(postGeom, this.matWood);
      p.position.set(px, 1.2, pz);
      group.add(p);
    });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 3.6), this.matThatch);
    roof.position.y = 2.5;
    roof.rotation.x = 0.12;
    group.add(roof);

    // Chopping Block Tree Stump with embedded iron axe
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.75, 7), this.matWood);
    stump.position.set(0, 0.38, 0);
    group.add(stump);

    const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.05), this.matIron);
    axeBlade.position.set(0, 0.85, 0);
    axeBlade.rotation.z = 0.4;
    group.add(axeBlade);

    // Neat stacks of split firewood
    const woodPileGeom = new THREE.BoxGeometry(0.8, 0.6, 1.8);
    const pile1 = new THREE.Mesh(woodPileGeom, this.matWood);
    pile1.position.set(-1.0, 0.4, 0);
    group.add(pile1);

    const pile2 = new THREE.Mesh(woodPileGeom, this.matWood);
    pile2.position.set(1.0, 0.4, 0);
    group.add(pile2);
  }

  // 3. Banished Blacksmith (锻造铁匠铺)
  constructBlacksmith(group, data) {
    const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 3.2), this.matStone);
    mainBuilding.position.y = 1.2;
    group.add(mainBuilding);

    const roofGeom = new THREE.ConeGeometry(3.0, 1.6, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeom, this.matThatch);
    roof.position.y = 3.2;
    group.add(roof);

    // Forge / Furnace with glowing orange heat
    const forge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), this.matStone);
    forge.position.set(1.2, 0.7, 1.8);
    group.add(forge);

    const forgeLight = new THREE.PointLight(0xff5511, 2.0, 8);
    forgeLight.position.set(1.2, 1.0, 1.8);
    group.add(forgeLight);

    // Heavy Iron Anvil on wooden base
    const anvilBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 6), this.matWood);
    anvilBase.position.set(-0.6, 0.3, 1.8);
    group.add(anvilBase);

    const anvilTop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.3), this.matAnvil);
    anvilTop.position.set(-0.6, 0.72, 1.8);
    group.add(anvilTop);

    // Tall Stone Chimney with sparks
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 0.8), this.matStone);
    chimney.position.set(1.2, 2.2, 1.8);
    group.add(chimney);

    data.chimneyPos = new THREE.Vector3(group.position.x + 1.2, group.position.y + 4.2, group.position.z + 1.8);
  }

  // 4. Interactive Farm with selectable crop
  constructInteractiveFarm(group, data) {
    const barn = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.0), this.matPlasterDark);
    barn.position.set(-1.8, 0.9, -1.8);
    group.add(barn);

    const roofGeom = new THREE.ConeGeometry(2.0, 1.4, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeom, this.matThatch);
    roof.position.set(-1.8, 2.3, -1.8);
    group.add(roof);

    // Crop Field Soil Ground (Clickable hit test area)
    const fieldGeom = new THREE.BoxGeometry(4.6, 0.2, 4.6);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x483522, roughness: 0.95 });
    const fieldSoil = new THREE.Mesh(fieldGeom, soilMat);
    fieldSoil.position.set(1.1, 0.1, 1.0);
    fieldSoil.userData = { isFarm: true, farmData: data };
    group.add(fieldSoil);
    data.fieldSoil = fieldSoil;

    data.cropGroup = new THREE.Group();
    data.cropGroup.position.set(1.1, 0.2, 1.0);
    group.add(data.cropGroup);

    this.populateFarmCrop(data, 'WHEAT');
  }

  populateFarmCrop(data, cropTypeKey) {
    data.cropType = cropTypeKey;
    const group = data.cropGroup;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    if (cropTypeKey === 'WHEAT') {
      const wheatGeom = new THREE.BoxGeometry(0.1, 0.65, 0.1);
      for (let i = 0; i < 36; i++) {
        const wx = -1.8 + (i % 6) * 0.7 + (Math.random() - 0.5) * 0.15;
        const wz = -1.8 + Math.floor(i / 6) * 0.7 + (Math.random() - 0.5) * 0.15;
        const wheat = new THREE.Mesh(wheatGeom, this.matWheat);
        wheat.position.set(wx, 0.32, wz);
        wheat.rotation.y = Math.random() * Math.PI;
        group.add(wheat);
      }
    } else if (cropTypeKey === 'RICE') {
      const waterGeom = new THREE.PlaneGeometry(4.4, 4.4);
      waterGeom.rotateX(-Math.PI / 2);
      const riceWaterMat = new THREE.MeshStandardMaterial({ color: 0x487968, roughness: 0.15, metalness: 0.2 });
      const water = new THREE.Mesh(waterGeom, riceWaterMat);
      water.position.y = 0.02;
      group.add(water);

      const riceGeom = new THREE.ConeGeometry(0.14, 0.55, 4);
      for (let i = 0; i < 36; i++) {
        const rx = -1.8 + (i % 6) * 0.7;
        const rz = -1.8 + Math.floor(i / 6) * 0.7;
        const shoot = new THREE.Mesh(riceGeom, this.matRiceGreen);
        shoot.position.set(rx, 0.25, rz);
        group.add(shoot);
      }
    } else if (cropTypeKey === 'VEGETABLES') {
      const cabbGeom = new THREE.DodecahedronGeometry(0.24, 1);
      for (let i = 0; i < 28; i++) {
        const cx = -1.7 + (i % 5) * 0.85;
        const cz = -1.7 + Math.floor(i / 5) * 0.85;
        const cabb = new THREE.Mesh(cabbGeom, this.matVeggieGreen);
        cabb.position.set(cx, 0.18, cz);
        group.add(cabb);
      }
    } else if (cropTypeKey === 'BERRIES') {
      const bushGeom = new THREE.DodecahedronGeometry(0.35, 1);
      const berryGeom = new THREE.SphereGeometry(0.06, 5, 5);
      for (let i = 0; i < 16; i++) {
        const bx = -1.5 + (i % 4) * 1.0;
        const bz = -1.5 + Math.floor(i / 4) * 1.0;
        const b = new THREE.Mesh(bushGeom, this.matVeggieGreen);
        b.position.set(bx, 0.25, bz);
        group.add(b);

        for (let k = 0; k < 3; k++) {
          const berry = new THREE.Mesh(berryGeom, this.matBerryRuby);
          berry.position.set(bx + (Math.random() - 0.5) * 0.3, 0.4 + Math.random() * 0.2, bz + (Math.random() - 0.5) * 0.3);
          group.add(berry);
        }
      }
    }
  }

  constructOutpost(group, data) {
    const pitGeom = new THREE.TorusGeometry(0.9, 0.25, 6, 12);
    pitGeom.rotateX(Math.PI / 2);
    const pit = new THREE.Mesh(pitGeom, this.matStone);
    pit.position.y = 0.2;
    group.add(pit);

    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2), this.matWood);
    log1.rotation.set(0.4, 0.5, 0.8);
    log1.position.y = 0.25;
    group.add(log1);

    const fireLight = new THREE.PointLight(0xff7722, 1.8, 14);
    fireLight.position.set(0, 0.8, 0);
    group.add(fireLight);
    data.fireLight = fireLight;

    const tentGeom = new THREE.ConeGeometry(1.8, 1.8, 4);
    tentGeom.rotateY(Math.PI / 4);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x9c8360, roughness: 0.9 });
    const tent1 = new THREE.Mesh(tentGeom, tentMat);
    tent1.position.set(-2.2, 0.9, -1.2);
    group.add(tent1);

    data.chimneyPos = new THREE.Vector3(group.position.x, group.position.y + 0.6, group.position.z);
  }

  constructLumber(group, data) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 3.5), this.matWood);
    floor.position.y = 0.1;
    group.add(floor);

    const postGeom = new THREE.CylinderGeometry(0.2, 0.2, 2.6, 6);
    [[-1.8, -1.5], [1.8, -1.5], [-1.8, 1.5], [1.8, 1.5]].forEach(([x, z]) => {
      const p = new THREE.Mesh(postGeom, this.matWood);
      p.position.set(x, 1.3, z);
      group.add(p);
    });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.2, 3.8), this.matWood);
    roof.position.set(0, 2.7, 0);
    roof.rotation.x = 0.15;
    group.add(roof);

    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.7, 7), this.matWood);
    stump.position.set(1.0, 0.35, 1.0);
    group.add(stump);
  }

  constructQuarry(group, data) {
    const pitFloor = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.3, 4.5), this.matStone);
    pitFloor.position.y = 0.15;
    group.add(pitFloor);

    const cranePole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.0, 6), this.matWood);
    cranePole.position.set(-1.0, 2.0, -1.0);
    group.add(cranePole);

    const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.9), this.matStone);
    b1.position.set(1.0, 0.45, 0.5);
    group.add(b1);
  }

  constructWell(group, data) {
    const curb = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.9, 12, 1, true), this.matStone);
    curb.position.y = 0.45;
    group.add(curb);

    const roofGeom = new THREE.ConeGeometry(1.4, 0.9, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeom, this.matThatch);
    roof.position.y = 2.4;
    group.add(roof);
  }

  constructGranary(group, data) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.4, 3.0), this.matWood);
    body.position.y = 2.0;
    group.add(body);

    const roofGeom = new THREE.ConeGeometry(3.0, 1.8, 4);
    roofGeom.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeom, this.matThatch);
    roof.position.y = 3.9;
    roof.scale.set(1.2, 1.0, 0.9);
    group.add(roof);
  }

  constructManor(group, data) {
    const mainKeep = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.8, 5.0), this.matStone);
    mainKeep.position.y = 2.4;
    group.add(mainKeep);

    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.6, 4), new THREE.MeshStandardMaterial({ color: 0x48515c, roughness: 0.7 }));
    mainRoof.rotateY(Math.PI / 4);
    mainRoof.position.y = 6.0;
    group.add(mainRoof);

    const bLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.8), this.matFabricRed);
    bLeft.position.set(-1.6, 3.2, 2.55);
    group.add(bLeft);

    data.chimneyPos = new THREE.Vector3(group.position.x + 2.2, group.position.y + 6.8, group.position.z - 1.0);
  }

  update(delta) {
    for (const b of this.buildings) {
      if (b.chimneyPos && Math.random() < 0.25) {
        this.createSmokeParticle(b.chimneyPos);
      }
      if (b.fireLight) {
        b.fireLight.intensity = 1.4 + Math.sin(Date.now() * 0.01) * 0.4 + Math.random() * 0.2;
      }
    }

    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.smokeParticles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      const scale = 0.2 + progress * 1.2;
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.material.opacity = (1.0 - progress) * 0.35;
    }
  }

  createSmokeParticle(origin) {
    const geom = new THREE.DodecahedronGeometry(0.18, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.smokeParticles.push({
      mesh,
      life: 0,
      maxLife: 2.2 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: 0.7 + Math.random() * 0.3,
      vz: (Math.random() - 0.5) * 0.15
    });
  }

  setFarmCrop(farmBuilding, cropType) {
    if (!farmBuilding) return;
    farmBuilding.cropType = cropType;

    // Update crop plant visual colors
    if (farmBuilding.cropMeshes) {
      let targetMat = this.matWheat;
      if (cropType === 'RICE') targetMat = this.matRiceGreen;
      else if (cropType === 'VEGETABLES') targetMat = this.matVeggieGreen;
      else if (cropType === 'BERRIES') targetMat = this.matBerryRuby;

      farmBuilding.cropMeshes.forEach(m => {
        m.material = targetMat;
      });
    }
  }

  serialize() {
    return this.buildings.map(b => ({
      type: b.typeKey || b.type,
      x: b.x,
      z: b.z,
      rotation: b.group ? b.group.rotation.y : 0,
      cropType: b.cropType || 'WHEAT'
    }));
  }

  deserialize(dataList) {
    if (!Array.isArray(dataList)) return;

    // Clear existing buildings from scene
    for (const b of this.buildings) {
      if (b.group) {
        this.scene.remove(b.group);
      }
    }
    this.buildings = [];

    // Reconstruct buildings
    for (const item of dataList) {
      const b = this.build(item.type, item.x, item.z, item.rotation || 0);
      if (b && item.cropType) {
        this.setFarmCrop(b, item.cropType);
      }
    }
  }
}
