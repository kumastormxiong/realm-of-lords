import * as THREE from '../../libs/three.module.js';
import { globalEvents } from '../core/EventBus.js';

export const CAMERA_MODES = {
  RTS: 'RTS',
  THIRD_PERSON: 'THIRD_PERSON',
  FIRST_PERSON: 'FIRST_PERSON'
};

export class CameraController {
  constructor(camera, domElement, lordCharacter) {
    this.camera = camera;
    this.domElement = domElement || window;
    this.lordCharacter = lordCharacter;

    this.mode = CAMERA_MODES.RTS;

    // RTS Mode parameters
    this.rtsTarget = new THREE.Vector3(0, 4, 0);
    this.rtsDistance = 45.0;
    this.rtsYaw = Math.PI * 0.25;
    this.rtsPitch = Math.PI * 0.26; // ~47 degrees
    this.rtsMinDistance = 8.0;
    this.rtsMaxDistance = 140.0;
    this.rtsPanSpeed = 35.0;

    // 3rd Person parameters
    this.tpDistance = 6.0;
    this.tpYaw = 0;
    this.tpPitch = 0.25;
    this.tpMinPitch = -0.3;
    this.tpMaxPitch = 0.85;

    // 1st Person parameters
    this.fpYaw = 0;
    this.fpPitch = 0;
    this.isPointerLocked = false;

    // Mouse drag state
    this.isMouseDown = false;
    this.mouseButton = -1;
    this.prevMousePos = { x: 0, y: 0 };

    this.bindEvents();
  }

  bindEvents() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);

    const el = this.domElement;
    el.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    // Prevent context menu on right click canvas
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;

    if (this.mode === CAMERA_MODES.FIRST_PERSON) {
      if (this.lordCharacter) {
        this.lordCharacter.setVisible(false);
        this.fpYaw = this.lordCharacter.yaw;
        this.fpPitch = 0;
      }
      globalEvents.emit('toast', { type: 'info', msg: '已切换至第一人称视角（点击画面锁定准星，可推门进入农舍）' });
    } else if (this.mode === CAMERA_MODES.THIRD_PERSON) {
      if (this.lordCharacter) {
        this.lordCharacter.setVisible(true);
        this.tpYaw = this.lordCharacter.yaw;
      }
      globalEvents.emit('toast', { type: 'info', msg: '已切换至第三人称领主追随视角（WASD移动，Shift冲刺）' });
    } else {
      if (this.lordCharacter) {
        this.lordCharacter.setVisible(true);
        this.rtsTarget.copy(this.lordCharacter.position);
      }
      globalEvents.emit('toast', { type: 'info', msg: '已切换至中世纪鸟瞰全局视角（右键旋转，滚轮缩放）' });
    }

    globalEvents.emit('camera-mode-changed', this.mode);
  }

  cycleMode() {
    if (this.mode === CAMERA_MODES.RTS) {
      this.setMode(CAMERA_MODES.THIRD_PERSON);
    } else if (this.mode === CAMERA_MODES.THIRD_PERSON) {
      this.setMode(CAMERA_MODES.FIRST_PERSON);
    } else {
      this.setMode(CAMERA_MODES.RTS);
    }
  }

  onMouseDown(e) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.ui-interactive')) {
      return;
    }

    this.isMouseDown = true;
    this.mouseButton = e.button;
    this.prevMousePos.x = e.clientX;
    this.prevMousePos.y = e.clientY;

    if (this.mode === CAMERA_MODES.FIRST_PERSON && !this.isPointerLocked) {
      const canvas = document.getElementById('webgl-canvas') || document.body;
      canvas.requestPointerLock?.();
    }
  }

  onMouseMove(e) {
    if (this.mode === CAMERA_MODES.FIRST_PERSON && this.isPointerLocked) {
      const sensitivity = 0.0022;
      this.fpYaw -= e.movementX * sensitivity;
      this.fpPitch -= e.movementY * sensitivity;
      this.fpPitch = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.fpPitch));
      if (this.lordCharacter) {
        this.lordCharacter.yaw = this.fpYaw;
      }
      return;
    }

    if (!this.isMouseDown) return;

    const dx = e.clientX - this.prevMousePos.x;
    const dy = e.clientY - this.prevMousePos.y;
    this.prevMousePos.x = e.clientX;
    this.prevMousePos.y = e.clientY;

    if (this.mode === CAMERA_MODES.RTS) {
      if (this.mouseButton === 2 || this.mouseButton === 1) { // Right or Middle button: Orbit
        this.rtsYaw -= dx * 0.006;
        this.rtsPitch = Math.max(0.2, Math.min(Math.PI * 0.45, this.rtsPitch + dy * 0.005));
      } else if (this.mouseButton === 0) { // Left button pan when in RTS
        const panScale = this.rtsDistance * 0.0016;
        const forward = new THREE.Vector3(-Math.sin(this.rtsYaw), 0, -Math.cos(this.rtsYaw));
        const right = new THREE.Vector3(-forward.z, 0, forward.x);

        this.rtsTarget.addScaledVector(right, -dx * panScale);
        this.rtsTarget.addScaledVector(forward, dy * panScale);
      }
    } else if (this.mode === CAMERA_MODES.THIRD_PERSON) {
      if (this.mouseButton === 2 || this.mouseButton === 0) {
        this.tpYaw -= dx * 0.005;
        this.tpPitch = Math.max(this.tpMinPitch, Math.min(this.tpMaxPitch, this.tpPitch + dy * 0.004));
      }
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.mouseButton = -1;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;

    if (this.mode === CAMERA_MODES.RTS) {
      this.rtsDistance = Math.max(this.rtsMinDistance, Math.min(this.rtsMaxDistance, this.rtsDistance * zoomFactor));
    } else if (this.mode === CAMERA_MODES.THIRD_PERSON) {
      this.tpDistance = Math.max(2.5, Math.min(18.0, this.tpDistance * zoomFactor));
    }
  }

  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement !== null;
  }

  update(delta, rtsPanInput = { x: 0, z: 0 }) {
    if (this.mode === CAMERA_MODES.RTS) {
      // Keyboard panning in RTS
      if (rtsPanInput.x !== 0 || rtsPanInput.z !== 0) {
        const forward = new THREE.Vector3(-Math.sin(this.rtsYaw), 0, -Math.cos(this.rtsYaw));
        const right = new THREE.Vector3(-forward.z, 0, forward.x);
        this.rtsTarget.addScaledVector(right, rtsPanInput.x * this.rtsPanSpeed * delta);
        this.rtsTarget.addScaledVector(forward, rtsPanInput.z * this.rtsPanSpeed * delta);
      }

      // Spherical coordinates calculation
      const cx = this.rtsTarget.x + this.rtsDistance * Math.cos(this.rtsPitch) * Math.sin(this.rtsYaw);
      const cy = this.rtsTarget.y + this.rtsDistance * Math.sin(this.rtsPitch);
      const cz = this.rtsTarget.z + this.rtsDistance * Math.cos(this.rtsPitch) * Math.cos(this.rtsYaw);

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(this.rtsTarget);

    } else if (this.mode === CAMERA_MODES.THIRD_PERSON) {
      if (!this.lordCharacter) return;
      const targetPos = this.lordCharacter.position.clone().add(new THREE.Vector3(0, 1.4, 0));

      const cx = targetPos.x - this.tpDistance * Math.cos(this.tpPitch) * Math.sin(this.tpYaw);
      const cy = targetPos.y + this.tpDistance * Math.sin(this.tpPitch);
      const cz = targetPos.z - this.tpDistance * Math.cos(this.tpPitch) * Math.cos(this.tpYaw);

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(targetPos);

    } else if (this.mode === CAMERA_MODES.FIRST_PERSON) {
      if (!this.lordCharacter) return;
      const eyePos = this.lordCharacter.getEyePosition();
      this.camera.position.copy(eyePos);

      // Look direction from yaw and pitch
      const lookDir = new THREE.Vector3(
        Math.sin(this.fpYaw) * Math.cos(this.fpPitch),
        Math.sin(this.fpPitch),
        Math.cos(this.fpYaw) * Math.cos(this.fpPitch)
      );

      const lookTarget = eyePos.clone().add(lookDir);
      this.camera.lookAt(lookTarget);
    }
  }

  getCameraForward() {
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    return fwd;
  }
}
