import * as THREE from '../../libs/three.module.js';
import { BUILDING_TYPES, RANKS } from './Constants.js';
import { globalEvents } from './EventBus.js';
import { StorageAdapter } from './StorageAdapter.js';
import { Renderer } from '../rendering/Renderer.js';
import { CameraController } from '../rendering/CameraController.js';
import { WeatherSystem } from '../rendering/WeatherSystem.js';
import { SeasonSystem } from '../rendering/SeasonSystem.js';
import { Terrain } from '../environment/Terrain.js';
import { FoliageManager } from '../environment/FoliageManager.js';
import { BuildingManager } from '../entities/BuildingManager.js';
import { VillagerManager } from '../entities/VillagerManager.js';
import { LordCharacter } from '../entities/LordCharacter.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { ProfessionSystem } from '../systems/ProfessionSystem.js';
import { AchievementManager } from '../systems/AchievementManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { UIManager } from '../ui/UIManager.js';

export class Game {
  constructor() {
    this.timeSpeed = 1.0;
    this.lastTime = performance.now();
    this.buildingPlacementMode = null;
    this.placementGhost = null;

    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false
    };

    this.rtsPanInput = { x: 0, z: 0 };
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  init() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0035);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.5,
      1000
    );

    // 2. Storage & Event Bus
    this.storageAdapter = new StorageAdapter();

    // 3. Renderer
    this.renderer = new Renderer();

    // 4. Audio
    this.audioManager = new AudioManager();

    // 5. Environment (Terrain & Foliage)
    this.terrain = new Terrain(this.scene);
    this.foliage = new FoliageManager(this.scene, this.terrain);

    // 6. Entities (Lord & Buildings)
    this.lordCharacter = new LordCharacter(this.scene, this.terrain);
    this.buildingManager = new BuildingManager(this.scene, this.terrain);

    // 7. Systems (Economy, Professions, Achievements, Weather, Seasons)
    this.seasonSystem = new SeasonSystem(this.scene, this.terrain, this.foliage);
    this.weatherSystem = new WeatherSystem(this.scene);
    this.economySystem = new EconomySystem(this.seasonSystem);
    this.professionSystem = new ProfessionSystem(this.economySystem, this.buildingManager);
    this.economySystem.buildingManager = this.buildingManager;
    this.economySystem.professionSystem = this.professionSystem;
    this.achievementManager = new AchievementManager();

    // 8. Villager Simulation
    this.villagerManager = new VillagerManager(
      this.scene,
      this.terrain,
      this.buildingManager,
      this.professionSystem,
      this.economySystem
    );

    // 9. Camera Controller
    this.cameraController = new CameraController(this.camera, this.renderer.domElement, this.lordCharacter);

    // 10. UI Manager
    this.uiManager = new UIManager(this);

    // Initial Outpost placement
    this.setupInitialSettlement();

    // Input & Interaction Listeners
    this.setupInputListeners();
    this.setupPlacementGhost();

    // Autosave timer
    this.autosaveTimer = 0;

    // Start Game Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    console.log('[Game] Realm of Lords initialized successfully.');
  }

  setupInitialSettlement() {
    // Spawn initial Outpost campfire & central cottage
    this.buildingManager.addBuilding('outpost', 0, 0, 0);
    this.buildingManager.addBuilding('cottage', -8, 6, 0.4);
    this.buildingManager.addBuilding('farm', 10, -6, 0);

    // Register initial housing & jobs
    this.economySystem.updateMaxHousing(this.buildingManager.buildings);
    this.professionSystem.updateMaxSlots();
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputState.forward = true;
          this.rtsPanInput.z = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputState.backward = true;
          this.rtsPanInput.z = -1;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputState.left = true;
          this.rtsPanInput.x = -1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputState.right = true;
          this.rtsPanInput.x = 1;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.inputState.sprint = true;
          break;
        case 'KeyV':
          this.cameraController.cycleMode();
          break;
        case 'KeyE':
          this.handleInteractionKey();
          break;
        case 'Escape':
          this.cancelPlacement();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.inputState.forward = false;
          if (this.rtsPanInput.z > 0) this.rtsPanInput.z = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.inputState.backward = false;
          if (this.rtsPanInput.z < 0) this.rtsPanInput.z = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.inputState.left = false;
          if (this.rtsPanInput.x < 0) this.rtsPanInput.x = 0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputState.right = false;
          if (this.rtsPanInput.x > 0) this.rtsPanInput.x = 0;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.inputState.sprint = false;
          break;
      }
    });

    // Mouse movement for ghost placement & clicking
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.buildingPlacementMode && this.placementGhost) {
        this.updatePlacementGhostPosition();
      }
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      if (e.target.closest('.ui-interactive')) return;

      if (this.buildingPlacementMode) {
        this.confirmPlacement();
      } else {
        this.handleWorldClick();
      }
    });
  }

  setupPlacementGhost() {
    const geo = new THREE.BoxGeometry(4, 3, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.45,
      wireframe: true
    });
    this.placementGhost = new THREE.Mesh(geo, mat);
    this.placementGhost.visible = false;
    this.scene.add(this.placementGhost);
  }

  startPlacement(buildingId) {
    this.buildingPlacementMode = buildingId;
    this.placementGhost.visible = true;
    const bType = BUILDING_TYPES[buildingId.toUpperCase()];
    if (bType) {
      const s = bType.size || 4;
      this.placementGhost.scale.set(s, s * 0.75, s);
    }
  }

  cancelPlacement() {
    this.buildingPlacementMode = null;
    this.placementGhost.visible = false;
  }

  updatePlacementGhostPosition() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    if (!this.terrain.mesh) return;

    const hits = this.raycaster.intersectObject(this.terrain.mesh);
    if (hits.length > 0) {
      const p = hits[0].point;
      const bType = BUILDING_TYPES[this.buildingPlacementMode.toUpperCase()];
      const canAfford = this.economySystem.canAfford(bType.cost);

      this.placementGhost.position.set(p.x, p.y + (bType.size * 0.35), p.z);
      this.placementGhost.material.color.setHex(canAfford ? 0x44ff44 : 0xff4444);
    }
  }

  confirmPlacement() {
    if (!this.buildingPlacementMode) return;
    const bType = BUILDING_TYPES[this.buildingPlacementMode.toUpperCase()];
    if (!bType) return;

    if (!this.economySystem.canAfford(bType.cost)) {
      globalEvents.emit('toast', { type: 'warning', msg: '领地资源不足，无法建造该工程！' });
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);
    if (hits.length > 0) {
      const p = hits[0].point;

      // Deduct resources
      this.economySystem.deductCost(bType.cost);

      // Build in 3D world
      const building = this.buildingManager.addBuilding(
        this.buildingPlacementMode,
        p.x,
        p.z,
        Math.random() * Math.PI * 2
      );

      // Update capacities & jobs
      this.economySystem.updateMaxHousing(this.buildingManager.buildings);
      this.professionSystem.updateMaxSlots();

      globalEvents.emit('toast', {
        type: 'success',
        msg: `【${bType.name}】已成功落成！`
      });

      // Clear placement
      this.cancelPlacement();
    }
  }

  handleWorldClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check clicking on farms
    for (const b of this.buildingManager.buildings) {
      if (b.type === 'farm') {
        const hits = this.raycaster.intersectObjects(b.mesh.children, true);
        if (hits.length > 0) {
          globalEvents.emit('open-crop-selector', b);
          return;
        }
      }
    }
  }

  handleInteractionKey() {
    // Check if near any Cottage to enter
    const cottages = this.buildingManager.buildings.filter(b => b.type === 'cottage');
    for (const cottage of cottages) {
      const d = this.lordCharacter.position.distanceTo(cottage.position);
      if (d < 4.5) {
        // Step into cottage
        this.lordCharacter.position.set(
          cottage.position.x,
          this.terrain.getElevation(cottage.position.x, cottage.position.z),
          cottage.position.z
        );
        this.cameraController.setMode('FIRST_PERSON');
        this.achievementManager.unlock('enter');
        globalEvents.emit('toast', {
          type: 'success',
          msg: '领主已步入农舍，壁炉炉火正旺，暖意融融。'
        });
        return;
      }
    }
  }

  checkProximityPrompts() {
    const cottages = this.buildingManager.buildings.filter(b => b.type === 'cottage');
    let nearCottage = false;

    for (const cottage of cottages) {
      const d = this.lordCharacter.position.distanceTo(cottage.position);
      if (d < 4.5) {
        nearCottage = true;
        this.uiManager.setInteractionPrompt(true, '按 [E] 步入农舍壁炉取暖');
        break;
      }
    }

    if (!nearCottage) {
      this.uiManager.setInteractionPrompt(false);
    }
  }

  setTimeSpeed(speed) {
    this.timeSpeed = speed;
  }

  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const rawDelta = (now - this.lastTime) * 0.001;
    this.lastTime = now;

    // Clamp delta to prevent crazy physics jumps
    const delta = Math.min(rawDelta, 0.1) * this.timeSpeed;

    // 1. Lord Character movement (responds to camera forward vector)
    const camFwd = this.cameraController.getCameraForward();
    this.lordCharacter.update(delta, this.inputState, camFwd);

    // 2. Camera tracking
    this.cameraController.update(delta, this.rtsPanInput);

    // 3. Proximity interactions
    this.checkProximityPrompts();

    if (delta > 0) {
      // 4. Seasons & Weather
      this.seasonSystem.update(delta);
      const curSeason = this.seasonSystem.getCurrentSeason();
      this.weatherSystem.update(delta, curSeason);

      // 5. Economy & Workforce
      this.economySystem.update(delta, curSeason);
      this.buildingManager.update(delta, curSeason);
      this.foliage.update(delta);

      // 6. Villager AI & Population Simulation
      this.villagerManager.update(delta, curSeason, this.weatherSystem.currentWeather);

      // 7. Achievements condition evaluation
      this.achievementManager.checkEconomy(this.economySystem);

      // 8. Lord Rank progression according to population
      const lordRank = this.calculateLordRank();
      if (lordRank !== this.lordCharacter.currentRank) {
        this.lordCharacter.updateRankVisuals(lordRank);
        globalEvents.emit('toast', {
          type: 'achievement',
          msg: `🎉 领主晋阶！你已被领民尊奉为【${RANKS[lordRank].title}】！`
        });
      }

      // 9. UI Sync
      this.uiManager.update(this.economySystem, this.seasonSystem, lordRank);

      // 10. Autosave every 3 minutes
      this.autosaveTimer += delta;
      if (this.autosaveTimer >= 180.0) {
        this.autosaveTimer = 0;
        this.storageAdapter.saveGame('autosave', this.serialize());
      }
    }

    // 11. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  calculateLordRank() {
    const pop = this.economySystem.population.total;
    let rank = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (pop >= RANKS[i].popReq) {
        rank = i;
      }
    }
    return rank;
  }

  serialize() {
    return {
      version: '1.0.0',
      savedAt: new Date().toISOString(),
      economy: this.economySystem.serialize(),
      season: this.seasonSystem.serialize(),
      timeOfDay: this.weatherSystem.timeOfDay,
      lord: {
        x: this.lordCharacter.position.x,
        z: this.lordCharacter.position.z,
        rank: this.lordCharacter.currentRank
      },
      buildings: this.buildingManager.serialize(),
      achievements: this.achievementManager.serialize(),
      professions: this.professionSystem.getAllocations()
    };
  }

  deserialize(data) {
    if (!data) return;

    if (data.economy) this.economySystem.deserialize(data.economy);
    if (data.season) this.seasonSystem.deserialize(data.season);
    if (data.timeOfDay) this.weatherSystem.timeOfDay = data.timeOfDay;
    if (data.lord) {
      this.lordCharacter.position.x = data.lord.x;
      this.lordCharacter.position.z = data.lord.z;
      this.lordCharacter.updateRankVisuals(data.lord.rank || 0);
    }
    if (data.buildings) {
      this.buildingManager.deserialize(data.buildings);
      this.economySystem.updateMaxHousing(this.buildingManager.buildings);
      this.professionSystem.updateMaxSlots();
    }
    if (data.achievements) this.achievementManager.deserialize(data.achievements);
    if (data.professions) this.professionSystem.deserialize(data.professions);

    this.villagerManager.syncDemographics();
  }
}
