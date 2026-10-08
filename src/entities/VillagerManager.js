import * as THREE from '../../libs/three.module.js';
import { PROFESSIONS } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';

export class VillagerManager {
  constructor(scene, terrain, buildingManager, professionSystem, economySystem) {
    this.scene = scene;
    this.terrain = terrain;
    this.buildingManager = buildingManager;
    this.professionSystem = professionSystem;
    this.economySystem = economySystem;

    this.villagers = [];
    this.villagerGroup = new THREE.Group();
    this.villagerGroup.name = 'Villagers';
    this.scene.add(this.villagerGroup);

    this.initSharedMaterials();
    this.initStartingVillagers(12);

    // Aging timer: 1 year per 60 seconds
    this.agingAccumulator = 0;
  }

  initSharedMaterials() {
    this.matSkinTones = [
      new THREE.MeshStandardMaterial({ color: 0xe0ad8a, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0xd29774, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0xf0c5a8, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0xc4825d, roughness: 0.7 })
    ];

    this.matHairColors = [
      new THREE.MeshStandardMaterial({ color: 0x2b1c11, roughness: 0.85 }), // Brown
      new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 }), // Black
      new THREE.MeshStandardMaterial({ color: 0x9e6830, roughness: 0.85 }), // Blonde
      new THREE.MeshStandardMaterial({ color: 0x8a391a, roughness: 0.85 }), // Red/Auburn
      new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.85 })  // Grey (Elder)
    ];

    this.matClothes = [
      new THREE.MeshStandardMaterial({ color: 0x4a5b3a, roughness: 0.85 }), // Moss green
      new THREE.MeshStandardMaterial({ color: 0x5a4432, roughness: 0.85 }), // Leather brown
      new THREE.MeshStandardMaterial({ color: 0x2f4858, roughness: 0.85 }), // Slate blue
      new THREE.MeshStandardMaterial({ color: 0x7a3e2b, roughness: 0.85 }), // Russet red
      new THREE.MeshStandardMaterial({ color: 0x6e685f, roughness: 0.85 })  // Linen grey
    ];

    this.matPants = new THREE.MeshStandardMaterial({ color: 0x2b2723, roughness: 0.9 });
    this.matBoots = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.9 });
    this.matIronTool = new THREE.MeshStandardMaterial({ color: 0x666b73, roughness: 0.4, metalness: 0.8 });
    this.matWoodTool = new THREE.MeshStandardMaterial({ color: 0x7d5a3c, roughness: 0.85 });
    this.matSwaddle = new THREE.MeshStandardMaterial({ color: 0xd6cbb8, roughness: 0.9 });
  }

  initStartingVillagers(count = 12) {
    // Generate initial population with diverse demographics
    // 2 Infants, 2 Children, 6 Young/Middle Adults, 2 Elders
    const startingAges = [1, 2, 8, 12, 19, 24, 28, 33, 41, 48, 62, 68];

    for (let i = 0; i < count; i++) {
      const age = i < startingAges.length ? startingAges[i] : (18 + Math.floor(Math.random() * 35));
      const angle = (i / count) * Math.PI * 2;
      const dist = 4 + Math.random() * 6;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      this.spawnVillager(x, z, age);
    }
  }

  getStageFromAge(age) {
    if (age <= 3) return 'infant';
    if (age <= 14) return 'child';
    if (age <= 35) return 'young_adult';
    if (age <= 55) return 'middle_aged';
    return 'elder';
  }

  spawnVillager(x, z, age = 20) {
    const stage = this.getStageFromAge(age);
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const id = 'v_' + Math.random().toString(36).substr(2, 9);

    const villager = {
      id,
      age,
      stage,
      gender,
      profession: (stage === 'infant' || stage === 'child') ? 'CHILD' : 'LABORER',
      warmth: 100,
      hunger: 0,
      health: 100,
      state: 'WALKING_TO_WORK', // WALKING_TO_WORK, WORKING, RESTING, SEEKING_WARMTH
      stateTimer: 0,
      position: new THREE.Vector3(x, this.terrain ? this.terrain.getElevation(x, z) : 3.8, z),
      targetPos: new THREE.Vector3(x, 0, z),
      speed: stage === 'elder' ? 2.0 : (stage === 'child' ? 3.5 : 2.8),
      walkCycle: Math.random() * 10,
      workCycle: 0,
      assignedWorkBuilding: null,
      assignedHomeBuilding: null,
      group: null,
      limbs: {}
    };

    this.buildVillagerMesh(villager);
    this.villagers.push(villager);
    this.villagerGroup.add(villager.group);

    return villager;
  }

  buildVillagerMesh(v) {
    const group = new THREE.Group();
    group.name = `Villager_${v.id}`;
    group.position.copy(v.position);

    const skinMat = this.matSkinTones[Math.floor(Math.random() * this.matSkinTones.length)];
    const hairMat = v.stage === 'elder' ? this.matHairColors[4] : this.matHairColors[Math.floor(Math.random() * 4)];
    const clothMat = this.matClothes[Math.floor(Math.random() * this.matClothes.length)];

    let scale = 1.0;
    if (v.stage === 'infant') scale = 0.42;
    else if (v.stage === 'child') scale = 0.68;
    else if (v.stage === 'elder') scale = 0.94;

    group.scale.set(scale, scale, scale);

    if (v.stage === 'infant') {
      // Swaddled infant model
      const swaddleGeo = new THREE.CapsuleGeometry(0.2, 0.45, 8, 8);
      const swaddleMesh = new THREE.Mesh(swaddleGeo, this.matSwaddle);
      swaddleMesh.position.y = 0.3;
      swaddleMesh.castShadow = true;
      group.add(swaddleMesh);

      // Baby head
      const babyHeadGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const babyHead = new THREE.Mesh(babyHeadGeo, skinMat);
      babyHead.position.set(0, 0.45, 0.05);
      group.add(babyHead);

      v.group = group;
      return;
    }

    // Full humanoid character model for Children, Adults & Elders
    // 1. Torso
    const torsoH = v.stage === 'child' ? 0.48 : 0.62;
    const torsoW = v.stage === 'child' ? 0.38 : 0.48;
    const torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, 0.28);
    const torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
    torsoMesh.position.y = 0.95;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    group.add(torsoMesh);

    if (v.stage === 'elder') {
      // Elder slightly bent posture
      torsoMesh.rotation.x = 0.16;
    }

    // 2. Head & Hair
    const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.25);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 0.46;
    headMesh.castShadow = true;
    torsoMesh.add(headMesh);

    // Hair or cap
    const hairGeo = new THREE.BoxGeometry(0.28, 0.14, 0.27);
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.12, -0.01);
    headMesh.add(hairMesh);

    // 3. Legs
    const legGeo = new THREE.BoxGeometry(0.16, 0.6, 0.18);
    legGeo.translate(0, -0.28, 0);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(0.12, 0.65, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.matPants);
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);

    const bootGeo = new THREE.BoxGeometry(0.18, 0.2, 0.24);
    const leftBoot = new THREE.Mesh(bootGeo, this.matBoots);
    leftBoot.position.set(0, -0.52, 0.03);
    leftLeg.add(leftBoot);
    group.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(-0.12, 0.65, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.matPants);
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(bootGeo, this.matBoots);
    rightBoot.position.set(0, -0.52, 0.03);
    rightLeg.add(rightBoot);
    group.add(rightLeg);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.13, 0.52, 0.13);
    armGeo.translate(0, -0.22, 0);

    const leftArm = new THREE.Group();
    leftArm.position.set(torsoW * 0.58, 0.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, clothMat);
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    torsoMesh.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(-torsoW * 0.58, 0.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, clothMat);
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
    torsoMesh.add(rightArm);

    // 5. Tool / Cane in Hand
    const toolGroup = new THREE.Group();
    toolGroup.position.set(0, -0.44, 0.1);
    rightArm.add(toolGroup);

    if (v.stage === 'elder') {
      // Walking cane for elders
      const caneGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6);
      const caneMesh = new THREE.Mesh(caneGeo, this.matWoodTool);
      caneMesh.position.y = -0.15;
      caneMesh.rotation.x = -0.2;
      caneMesh.castShadow = true;
      toolGroup.add(caneMesh);
    } else {
      // Functional work tool based on profession
      this.attachProfessionTool(toolGroup, v.profession);
    }

    v.group = group;
    v.limbs = {
      torso: torsoMesh,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      toolGroup
    };
  }

  attachProfessionTool(toolGroup, profession) {
    while (toolGroup.children.length > 0) {
      toolGroup.remove(toolGroup.children[0]);
    }

    if (profession === 'FARMER') {
      // Hoe
      const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
      const handle = new THREE.Mesh(handleGeo, this.matWoodTool);
      handle.rotation.x = 0.3;
      toolGroup.add(handle);

      const bladeGeo = new THREE.BoxGeometry(0.16, 0.02, 0.08);
      const blade = new THREE.Mesh(bladeGeo, this.matIronTool);
      blade.position.set(0, 0.38, 0.08);
      handle.add(blade);
    } else if (profession === 'LUMBERJACK' || profession === 'WOODCUTTER_WORKER') {
      // Woodcutter's Axe
      const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 6);
      const handle = new THREE.Mesh(handleGeo, this.matWoodTool);
      handle.rotation.x = 0.2;
      toolGroup.add(handle);

      const axeHeadGeo = new THREE.BoxGeometry(0.05, 0.16, 0.12);
      const axeHead = new THREE.Mesh(axeHeadGeo, this.matIronTool);
      axeHead.position.set(0, 0.26, 0.04);
      handle.add(axeHead);
    } else if (profession === 'BLACKSMITH_WORKER' || profession === 'BUILDER') {
      // Hammer
      const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6);
      const handle = new THREE.Mesh(handleGeo, this.matWoodTool);
      toolGroup.add(handle);

      const hammerHeadGeo = new THREE.BoxGeometry(0.08, 0.1, 0.14);
      const hammerHead = new THREE.Mesh(hammerHeadGeo, this.matIronTool);
      hammerHead.position.set(0, 0.2, 0);
      handle.add(hammerHead);
    } else if (profession === 'MINER') {
      // Pickaxe
      const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6);
      const handle = new THREE.Mesh(handleGeo, this.matWoodTool);
      toolGroup.add(handle);

      const pickGeo = new THREE.BoxGeometry(0.04, 0.05, 0.3);
      const pick = new THREE.Mesh(pickGeo, this.matIronTool);
      pick.position.set(0, 0.34, 0);
      pick.rotation.x = 0.2;
      handle.add(pick);
    } else {
      // Laborer / Porter Basket or small pack
      const basketGeo = new THREE.BoxGeometry(0.24, 0.2, 0.2);
      const basket = new THREE.Mesh(basketGeo, this.matWoodTool);
      basket.position.set(0, 0, 0.1);
      toolGroup.add(basket);
    }
  }

  update(delta, seasonInfo, weatherInfo) {
    this.agingAccumulator += delta;
    if (this.agingAccumulator >= 45.0) { // 1 in-game year every 45s
      this.agingAccumulator = 0;
      this.tickAging();
    }

    const buildings = this.buildingManager ? this.buildingManager.buildings : [];
    const outpost = buildings.find(b => b.type === 'outpost') || { position: new THREE.Vector3(0, 0, 0) };

    for (let i = this.villagers.length - 1; i >= 0; i--) {
      const v = this.villagers[i];

      // Handle mortality & life checks
      if (v.health <= 0) {
        this.killVillager(i, '自然逝世');
        continue;
      }

      // Purposeful AI destination selection
      this.updateVillagerAI(v, buildings, outpost, delta, seasonInfo);

      // Movement & terrain elevation tracking
      this.updateVillagerMovement(v, delta);
    }

    // Check births if population below max housing
    this.checkBirths(buildings);
  }

  updateVillagerAI(v, buildings, outpost, delta, seasonInfo) {
    v.stateTimer += delta;

    if (v.stage === 'infant') {
      // Infant stays with parent or at cottage
      return;
    }

    // Freezing weather logic: head to warmth
    const isFreezing = seasonInfo && seasonInfo.temp < 0;
    if (isFreezing && v.warmth < 30) {
      v.state = 'SEEKING_WARMTH';
      const nearestWarmth = this.findNearestCottageOrOutpost(v.position, buildings, outpost);
      v.targetPos.copy(nearestWarmth.position);
    }

    if (v.state === 'WALKING_TO_WORK') {
      const distToTarget = v.position.distanceTo(v.targetPos);
      if (distToTarget < 2.0) {
        v.state = 'WORKING';
        v.stateTimer = 0;
      }
    } else if (v.state === 'WORKING') {
      // Work cycle animation
      v.workCycle += delta * 6;
      if (v.limbs.rightArm) {
        v.limbs.rightArm.rotation.x = Math.sin(v.workCycle) * 0.7 - 0.4;
      }

      // Finish work shift after 10-15s, return home or haul
      if (v.stateTimer > 12.0) {
        v.state = 'RESTING';
        v.stateTimer = 0;
        const home = this.findNearestCottageOrOutpost(v.position, buildings, outpost);
        v.targetPos.set(
          home.position.x + (Math.random() - 0.5) * 3,
          0,
          home.position.z + (Math.random() - 0.5) * 3
        );
      }
    } else if (v.state === 'RESTING') {
      if (v.stateTimer > 6.0) {
        // Head back to purposeful work location
        this.assignWorkTarget(v, buildings, outpost);
        v.state = 'WALKING_TO_WORK';
        v.stateTimer = 0;
      }
    } else if (v.state === 'SEEKING_WARMTH') {
      const dist = v.position.distanceTo(v.targetPos);
      if (dist < 3.0) {
        v.warmth = Math.min(100, v.warmth + delta * 20);
        if (v.warmth >= 80) {
          v.state = 'WALKING_TO_WORK';
          this.assignWorkTarget(v, buildings, outpost);
        }
      }
    }
  }

  assignWorkTarget(v, buildings, outpost) {
    if (v.profession === 'FARMER') {
      const farms = buildings.filter(b => b.type === 'farm');
      if (farms.length > 0) {
        const farm = farms[Math.floor(Math.random() * farms.length)];
        v.targetPos.set(
          farm.position.x + (Math.random() - 0.5) * 4,
          0,
          farm.position.z + (Math.random() - 0.5) * 4
        );
        return;
      }
    } else if (v.profession === 'LUMBERJACK') {
      const lumbers = buildings.filter(b => b.type === 'lumber');
      if (lumbers.length > 0) {
        const camp = lumbers[Math.floor(Math.random() * lumbers.length)];
        v.targetPos.set(
          camp.position.x + (Math.random() - 0.5) * 5,
          0,
          camp.position.z + (Math.random() - 0.5) * 5
        );
        return;
      }
    } else if (v.profession === 'WOODCUTTER_WORKER') {
      const woodcutters = buildings.filter(b => b.type === 'woodcutter');
      if (woodcutters.length > 0) {
        const shed = woodcutters[Math.floor(Math.random() * woodcutters.length)];
        v.targetPos.set(shed.position.x, 0, shed.position.z);
        return;
      }
    } else if (v.profession === 'BLACKSMITH_WORKER') {
      const blacksmiths = buildings.filter(b => b.type === 'blacksmith');
      if (blacksmiths.length > 0) {
        const forge = blacksmiths[Math.floor(Math.random() * blacksmiths.length)];
        v.targetPos.set(forge.position.x, 0, forge.position.z);
        return;
      }
    } else if (v.profession === 'MINER') {
      const quarries = buildings.filter(b => b.type === 'quarry');
      if (quarrys.length > 0) {
        const q = quarries[Math.floor(Math.random() * quarries.length)];
        v.targetPos.set(q.position.x, 0, q.position.z);
        return;
      }
    }

    // Default Laborer / fallback: roam near outpost or build site
    v.targetPos.set(
      outpost.position.x + (Math.random() - 0.5) * 14,
      0,
      outpost.position.z + (Math.random() - 0.5) * 14
    );
  }

  findNearestCottageOrOutpost(pos, buildings, outpost) {
    const shelters = buildings.filter(b => b.type === 'cottage' || b.type === 'outpost');
    if (shelters.length === 0) return outpost;

    let nearest = shelters[0];
    let minDist = 999999;
    for (const b of shelters) {
      const d = pos.distanceTo(b.position);
      if (d < minDist) {
        minDist = d;
        nearest = b;
      }
    }
    return nearest;
  }

  updateVillagerMovement(v, delta) {
    if (v.state === 'WORKING' && v.limbs.leftLeg) {
      v.limbs.leftLeg.rotation.x = 0;
      v.limbs.rightLeg.rotation.x = 0;
      return;
    }

    const dx = v.targetPos.x - v.position.x;
    const dz = v.targetPos.z - v.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq > 0.3) {
      const dist = Math.sqrt(distSq);
      const dirX = dx / dist;
      const dirZ = dz / dist;

      v.position.x += dirX * v.speed * delta;
      v.position.z += dirZ * v.speed * delta;

      // Face direction of travel
      const targetYaw = Math.atan2(dirX, dirZ);
      v.group.rotation.y = targetYaw;

      // Leg swing animation
      v.walkCycle += delta * (v.speed * 3.5);
      const legSwing = Math.sin(v.walkCycle) * 0.45;
      if (v.limbs.leftLeg) {
        v.limbs.leftLeg.rotation.x = legSwing;
        v.limbs.rightLeg.rotation.x = -legSwing;
        v.limbs.leftArm.rotation.x = -legSwing * 0.6;
        if (v.state !== 'WORKING') {
          v.limbs.rightArm.rotation.x = legSwing * 0.6;
        }
      }
    }

    // Keep clamped to terrain height
    if (this.terrain) {
      v.position.y = this.terrain.getElevation(v.position.x, v.position.z);
    }
    v.group.position.copy(v.position);
  }

  tickAging() {
    let deaths = 0;
    for (const v of this.villagers) {
      v.age += 1;
      const oldStage = v.stage;
      v.stage = this.getStageFromAge(v.age);

      // Natural death probability starts at 60 and accelerates past 75
      if (v.age > 60) {
        const deathChance = (v.age - 58) * 0.035;
        if (Math.random() < deathChance) {
          v.health = 0;
          deaths++;
        }
      }
    }

    // Sync economy metrics
    this.syncDemographics();
  }

  killVillager(index, reason = '去世') {
    const v = this.villagers[index];
    this.villagerGroup.remove(v.group);
    this.villagers.splice(index, 1);

    globalEvents.emit('toast', {
      type: 'warning',
      msg: `一名村民（${v.age}岁）因${reason}不幸离世。`
    });

    this.syncDemographics();
  }

  checkBirths(buildings) {
    if (!this.economySystem) return;
    const maxCapacity = this.economySystem.population.maxCapacity;
    const curPop = this.villagers.length;

    // Conditions: Available housing room, food > 40, adult population available
    if (curPop < maxCapacity && this.economySystem.resources.food > 40) {
      const adults = this.villagers.filter(v => v.stage === 'young_adult' || v.stage === 'middle_aged');
      if (adults.length >= 2 && Math.random() < 0.02) {
        const parent = adults[Math.floor(Math.random() * adults.length)];
        const newborn = this.spawnVillager(
          parent.position.x + (Math.random() - 0.5) * 2,
          parent.position.z + (Math.random() - 0.5) * 2,
          0 // Infant
        );

        globalEvents.emit('toast', {
          type: 'success',
          msg: `领地新添丁！一位健康的婴儿降生在农舍中。`
        });

        this.syncDemographics();
      }
    }
  }

  syncDemographics() {
    if (!this.economySystem) return;

    let infants = 0, children = 0, young = 0, middle = 0, elders = 0;
    for (const v of this.villagers) {
      if (v.stage === 'infant') infants++;
      else if (v.stage === 'child') children++;
      else if (v.stage === 'young_adult') young++;
      else if (v.stage === 'middle_aged') middle++;
      else if (v.stage === 'elder') elders++;
    }

    this.economySystem.population.total = this.villagers.length;
    this.economySystem.population.infants = infants;
    this.economySystem.population.children = children;
    this.economySystem.population.youngAdults = young;
    this.economySystem.population.middleAged = middle;
    this.economySystem.population.elders = elders;
    this.economySystem.population.laborers = this.villagers.filter(v => v.profession === 'LABORER').length;

    globalEvents.emit('population-updated', this.economySystem.population);
  }
}
