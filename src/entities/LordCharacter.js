import * as THREE from '../../libs/three.module.js';
import { RANKS } from '../core/Constants.js';

export class LordCharacter {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // Movement state
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.targetYaw = 0;
    this.speed = 7.0; // m/s
    this.sprintMultiplier = 1.65;
    this.isMoving = false;
    this.isSprinting = false;

    // Animation state
    this.walkCycle = 0;
    this.capeSway = 0;
    this.currentRank = 0;

    // Model root group
    this.group = new THREE.Group();
    this.group.name = 'LordCharacter';
    this.scene.add(this.group);

    // Initial positioning in central meadow
    const initY = this.terrain ? this.terrain.getElevation(0, 0) : 3.8;
    this.position.set(0, initY, 0);
    this.group.position.copy(this.position);

    this.buildCharacterMesh();
    this.updateRankVisuals(0);
  }

  buildCharacterMesh() {
    // Hierarchical body parts for procedural animation
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    // Shared materials
    this.matSkin = new THREE.MeshStandardMaterial({ color: 0xdfab8e, roughness: 0.65 });
    this.matHair = new THREE.MeshStandardMaterial({ color: 0x3b2818, roughness: 0.8 });
    this.matBoots = new THREE.MeshStandardMaterial({ color: 0x24180e, roughness: 0.85 });
    this.matPants = new THREE.MeshStandardMaterial({ color: 0x363a40, roughness: 0.8 });
    this.matTunic = new THREE.MeshStandardMaterial({ color: 0x224433, roughness: 0.7 });
    this.matTrim = new THREE.MeshStandardMaterial({ color: 0xc8962c, roughness: 0.35, metalness: 0.7 });
    this.matSteel = new THREE.MeshStandardMaterial({ color: 0x8a929a, roughness: 0.3, metalness: 0.85 });
    this.matCape = new THREE.MeshStandardMaterial({ color: 0x8b1e1e, roughness: 0.8, side: THREE.DoubleSide });
    this.matBelt = new THREE.MeshStandardMaterial({ color: 0x1f140d, roughness: 0.7 });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.68, 0.32);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.matTunic);
    this.torsoMesh.position.y = 1.05;
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Belt & buckle
    const beltGeo = new THREE.BoxGeometry(0.57, 0.1, 0.34);
    const beltMesh = new THREE.Mesh(beltGeo, this.matBelt);
    beltMesh.position.y = -0.22;
    this.torsoMesh.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.36);
    this.buckleMesh = new THREE.Mesh(buckleGeo, this.matTrim);
    this.buckleMesh.position.y = -0.22;
    this.torsoMesh.add(this.buckleMesh);

    // 2. Neck & Head
    const neckGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.14, 8);
    const neckMesh = new THREE.Mesh(neckGeo, this.matSkin);
    neckMesh.position.y = 0.4;
    this.torsoMesh.add(neckMesh);

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.52;
    this.torsoMesh.add(this.headGroup);

    const headGeo = new THREE.BoxGeometry(0.3, 0.34, 0.3);
    const headMesh = new THREE.Mesh(headGeo, this.matSkin);
    headMesh.position.y = 0.17;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.32, 0.16, 0.33);
    this.hairMesh = new THREE.Mesh(hairGeo, this.matHair);
    this.hairMesh.position.set(0, 0.28, -0.02);
    this.headGroup.add(this.hairMesh);

    // Crown / Circlet / Helmet attachment point
    this.headgearGroup = new THREE.Group();
    this.headGroup.add(this.headgearGroup);

    // 3. Limbs (Shoulders & Arms)
    const armGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    armGeo.translate(0, -0.25, 0);

    // Left arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(0.36, 0.26, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, this.matTunic);
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.torsoMesh.add(this.leftArm);

    // Right arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(-0.36, 0.26, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, this.matTunic);
    rightArmMesh.castShadow = true;
    this.rightArm.add(rightArmMesh);
    this.torsoMesh.add(this.rightArm);

    // Pauldrons (Shoulder armor for higher ranks)
    this.pauldronGroup = new THREE.Group();
    this.torsoMesh.add(this.pauldronGroup);

    // Sword & scabbard on left hip
    this.weaponGroup = new THREE.Group();
    this.weaponGroup.position.set(0.32, -0.2, 0);
    this.torsoMesh.add(this.weaponGroup);
    this.buildWeaponMesh();

    // 4. Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.68, 0.22);
    legGeo.translate(0, -0.32, 0);

    // Left leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(0.15, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.matPants);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);

    const bootGeo = new THREE.BoxGeometry(0.22, 0.24, 0.32);
    const leftBootMesh = new THREE.Mesh(bootGeo, this.matBoots);
    leftBootMesh.position.set(0, -0.56, 0.04);
    leftBootMesh.castShadow = true;
    this.leftLeg.add(leftBootMesh);
    this.bodyGroup.add(this.leftLeg);

    // Right leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(-0.15, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.matPants);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);

    const rightBootMesh = new THREE.Mesh(bootGeo, this.matBoots);
    rightBootMesh.position.set(0, -0.56, 0.04);
    rightBootMesh.castShadow = true;
    this.rightLeg.add(rightBootMesh);
    this.bodyGroup.add(this.rightLeg);

    // 5. Dynamic Cape
    this.buildCapeMesh();
  }

  buildCapeMesh() {
    // 3-segment cape for fluid sway physics
    this.capeGroup = new THREE.Group();
    this.capeGroup.position.set(0, 0.32, -0.17);
    this.torsoMesh.add(this.capeGroup);

    const segGeo1 = new THREE.PlaneGeometry(0.54, 0.36);
    segGeo1.translate(0, -0.18, 0);
    this.capeSeg1 = new THREE.Mesh(segGeo1, this.matCape);
    this.capeSeg1.castShadow = true;
    this.capeGroup.add(this.capeSeg1);

    const segGeo2 = new THREE.PlaneGeometry(0.58, 0.36);
    segGeo2.translate(0, -0.18, 0);
    this.capeSeg2 = new THREE.Mesh(segGeo2, this.matCape);
    this.capeSeg2.position.set(0, -0.34, 0);
    this.capeSeg2.castShadow = true;
    this.capeSeg1.add(this.capeSeg2);

    const segGeo3 = new THREE.PlaneGeometry(0.62, 0.38);
    segGeo3.translate(0, -0.19, 0);
    this.capeSeg3 = new THREE.Mesh(segGeo3, this.matCape);
    this.capeSeg3.position.set(0, -0.34, 0);
    this.capeSeg3.castShadow = true;
    this.capeSeg2.add(this.capeSeg3);
  }

  buildWeaponMesh() {
    // Sword scabbard
    const scabbardGeo = new THREE.BoxGeometry(0.08, 0.7, 0.04);
    const scabbard = new THREE.Mesh(scabbardGeo, this.matBoots);
    scabbard.position.set(0, -0.22, 0);
    scabbard.rotation.z = 0.25;
    this.weaponGroup.add(scabbard);

    // Hilt & guard
    const guardGeo = new THREE.BoxGeometry(0.22, 0.04, 0.06);
    const guard = new THREE.Mesh(guardGeo, this.matTrim);
    guard.position.set(0, 0.15, 0);
    scabbard.add(guard);

    const pommelGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pommel = new THREE.Mesh(pommelGeo, this.matTrim);
    pommel.position.set(0, 0.32, 0);
    scabbard.add(pommel);
  }

  updateRankVisuals(rankIndex) {
    this.currentRank = rankIndex;
    const rank = RANKS[Math.min(rankIndex, RANKS.length - 1)];

    // Clear headgear & pauldrons
    while (this.headgearGroup.children.length > 0) {
      this.headgearGroup.remove(this.headgearGroup.children[0]);
    }
    while (this.pauldronGroup.children.length > 0) {
      this.pauldronGroup.remove(this.pauldronGroup.children[0]);
    }

    if (rankIndex === 0) {
      // Captain: Hunter green tunic, brown leather cape, simple steel headband
      this.matTunic.color.setHex(0x2d4536);
      this.matCape.color.setHex(0x523624);
      const headbandGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12);
      const headband = new THREE.Mesh(headbandGeo, this.matSteel);
      headband.position.y = 0.26;
      this.headgearGroup.add(headband);
    } else if (rankIndex === 1) {
      // Village Headman: Forest Green + Gold trim, warm wool cape, leather cap
      this.matTunic.color.setHex(0x1e4b30);
      this.matCape.color.setHex(0x6e2a1b);
      const capGeo = new THREE.CylinderGeometry(0.19, 0.21, 0.1, 12);
      const cap = new THREE.Mesh(capGeo, this.matTunic);
      cap.position.y = 0.34;
      this.headgearGroup.add(cap);
    } else if (rankIndex === 2) {
      // Baron: Royal Azure tunic, deep blue cape, silver circlet, silver pauldrons
      this.matTunic.color.setHex(0x1a3d6e);
      this.matCape.color.setHex(0x132a4e);
      this.matCape.roughness = 0.6;
      this.addCirclet(0xbac6d4);
      this.addPauldrons(0xbac6d4);
    } else if (rankIndex === 3) {
      // Viscount: Purple velvet tunic with gold trim, crimson cape, gilded pauldrons
      this.matTunic.color.setHex(0x3e184b);
      this.matCape.color.setHex(0x8a1525);
      this.addCirclet(0xe8ba3c);
      this.addPauldrons(0xe8ba3c);
    } else if (rankIndex === 4) {
      // Count: Crimson velvet tunic, royal gold trim, ermine cape, ornate golden crown
      this.matTunic.color.setHex(0x6e121e);
      this.matCape.color.setHex(0xa81a28);
      this.addCrown(0xf2c444);
      this.addPauldrons(0xf2c444);
    } else {
      // Duke: Imperial gold embroidered tunic, royal purple cape, majestic ruby crown
      this.matTunic.color.setHex(0x231a2c);
      this.matCape.color.setHex(0x5a187a);
      this.addCrown(0xffd700, true);
      this.addPauldrons(0xffd700);
    }
  }

  addCirclet(hexColor) {
    const circletGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.06, 16);
    const mat = new THREE.MeshStandardMaterial({ color: hexColor, metalness: 0.8, roughness: 0.3 });
    const circlet = new THREE.Mesh(circletGeo, mat);
    circlet.position.y = 0.28;
    this.headgearGroup.add(circlet);
  }

  addCrown(hexColor, withGems = false) {
    const crownMat = new THREE.MeshStandardMaterial({ color: hexColor, metalness: 0.85, roughness: 0.25 });
    const ringGeo = new THREE.CylinderGeometry(0.2, 0.19, 0.08, 16);
    const ring = new THREE.Mesh(ringGeo, crownMat);
    ring.position.y = 0.3;
    this.headgearGroup.add(ring);

    // Spikes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spikeGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
      const spike = new THREE.Mesh(spikeGeo, crownMat);
      spike.position.set(Math.cos(angle) * 0.19, 0.38, Math.sin(angle) * 0.19);
      this.headgearGroup.add(spike);

      if (withGems) {
        const gemGeo = new THREE.SphereGeometry(0.025, 6, 6);
        const gemMat = new THREE.MeshStandardMaterial({ color: 0xcc1122, roughness: 0.2 });
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.set(Math.cos(angle) * 0.21, 0.32, Math.sin(angle) * 0.21);
        this.headgearGroup.add(gem);
      }
    }
  }

  addPauldrons(hexColor) {
    const mat = new THREE.MeshStandardMaterial({ color: hexColor, metalness: 0.8, roughness: 0.3 });
    const pauldronGeo = new THREE.SphereGeometry(0.16, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);

    const leftP = new THREE.Mesh(pauldronGeo, mat);
    leftP.position.set(0.38, 0.32, 0);
    leftP.rotation.z = -0.3;
    leftP.castShadow = true;
    this.pauldronGroup.add(leftP);

    const rightP = new THREE.Mesh(pauldronGeo, mat);
    rightP.position.set(-0.38, 0.32, 0);
    rightP.rotation.z = 0.3;
    rightP.castShadow = true;
    this.pauldronGroup.add(rightP);
  }

  update(delta, inputState, cameraForward = null) {
    // inputState = { forward: bool, backward: bool, left: bool, right: bool, sprint: bool }
    let moveX = 0;
    let moveZ = 0;

    if (inputState.forward) moveZ += 1;
    if (inputState.backward) moveZ -= 1;
    if (inputState.left) moveX -= 1;
    if (inputState.right) moveX += 1;

    this.isMoving = moveX !== 0 || moveZ !== 0;
    this.isSprinting = inputState.sprint && this.isMoving;

    if (this.isMoving) {
      const moveVec = new THREE.Vector2(moveX, moveZ).normalize();

      // Determine movement direction relative to camera
      if (cameraForward) {
        // Flatten camera forward on XZ plane
        const fwd = new THREE.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x);

        const worldDir = new THREE.Vector3()
          .addScaledVector(fwd, moveVec.y)
          .addScaledVector(right, moveVec.x)
          .normalize();

        const curSpeed = this.speed * (this.isSprinting ? this.sprintMultiplier : 1.0);
        this.position.x += worldDir.x * curSpeed * delta;
        this.position.z += worldDir.z * curSpeed * delta;

        this.targetYaw = Math.atan2(worldDir.x, worldDir.z);
      } else {
        const curSpeed = this.speed * (this.isSprinting ? this.sprintMultiplier : 1.0);
        this.position.x += moveVec.x * curSpeed * delta;
        this.position.z += moveVec.y * curSpeed * delta;
        this.targetYaw = Math.atan2(moveVec.x, moveVec.y);
      }

      // Smooth yaw rotation
      let diff = this.targetYaw - this.yaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.yaw += diff * Math.min(1.0, delta * 12.0);

      // Walk cycle animation
      const animRate = (this.isSprinting ? 14 : 9) * delta;
      this.walkCycle += animRate;

      const swing = Math.sin(this.walkCycle) * (this.isSprinting ? 0.75 : 0.5);
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * 0.8;
      this.rightArm.rotation.x = swing * 0.8;

      // Torso bobbing
      this.torsoMesh.position.y = 1.05 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;

      // Cape billow
      const capeTargetTilt = this.isSprinting ? 0.85 : 0.45;
      this.capeSway += delta * 8;
      this.capeSeg1.rotation.x = capeTargetTilt + Math.sin(this.capeSway) * 0.12;
      this.capeSeg2.rotation.x = (capeTargetTilt * 0.6) + Math.cos(this.capeSway * 1.2) * 0.15;
    } else {
      // Idle relaxation
      this.leftLeg.rotation.x *= 0.85;
      this.rightLeg.rotation.x *= 0.85;
      this.leftArm.rotation.x *= 0.85;
      this.rightArm.rotation.x *= 0.85;

      // Subtle idle breathing
      this.walkCycle += delta * 1.5;
      this.torsoMesh.position.y = 1.05 + Math.sin(this.walkCycle) * 0.015;
      this.capeSeg1.rotation.x = 0.05 + Math.sin(this.walkCycle) * 0.03;
      this.capeSeg2.rotation.x = 0.05 + Math.cos(this.walkCycle) * 0.03;
    }

    // Keep on terrain
    if (this.terrain) {
      const targetY = this.terrain.getElevation(this.position.x, this.position.z);
      this.position.y = targetY;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
  }

  getEyePosition() {
    // Eye position for 1st-person camera mode
    return new THREE.Vector3(
      this.position.x,
      this.position.y + 1.62,
      this.position.z
    );
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  // Future GLTF 3D model replacement hook
  async loadExternalAvatar(modelUrl) {
    console.log(`[LordCharacter] Ready to load external avatar GLTF model from: ${modelUrl}`);
    // When GLTF loader is used, avatar will be attached to this.group and procedural mesh hidden
  }
}
