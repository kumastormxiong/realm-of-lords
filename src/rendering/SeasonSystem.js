import * as THREE from '../../libs/three.module.js';
import { SEASONS } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';

export class SeasonSystem {
  constructor(scene) {
    this.scene = scene;

    this.seasonOrder = [SEASONS.SPRING, SEASONS.SUMMER, SEASONS.AUTUMN, SEASONS.WINTER];
    this.currentSeasonIndex = 0;
    this.currentSeason = this.seasonOrder[0];

    this.year = 1;
    this.seasonProgress = 0.0; // 0.0 to 1.0 within season
    this.seasonDuration = 90.0; // Seconds per season (6 minutes for a full 4-season year)

    this.snowCoverage = 0.0; // 0.0 (no snow) to 1.0 (deep winter snow)
    this.temperature = 15;

    // Snow precipitation particle system for winter
    this.initSnowParticles();
  }

  initSnowParticles() {
    const snowCount = 2500;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(snowCount * 3);
    this.snowVelocities = new Float32Array(snowCount);

    for (let i = 0; i < snowCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 140;
      this.snowVelocities[i] = 4.0 + Math.random() * 3.5;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    this.snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      transparent: true,
      opacity: 0.0
    });

    this.snowMesh = new THREE.Points(geom, this.snowMat);
    this.snowMesh.visible = false;
    this.scene.add(this.snowMesh);
  }

  update(delta, playerPos) {
    this.seasonProgress += delta / this.seasonDuration;

    if (this.seasonProgress >= 1.0) {
      this.seasonProgress = 0;
      this.advanceSeason();
    }

    // Smooth temperature and snow accumulation transition
    const targetSnow = this.currentSeason.snowCoverage;
    this.snowCoverage = THREE.MathUtils.lerp(this.snowCoverage, targetSnow, delta * 0.15);
    this.temperature = THREE.MathUtils.lerp(this.temperature, this.currentSeason.temp, delta * 0.2);

    // Snow particles active during Winter or deep snow
    if (this.currentSeason === SEASONS.WINTER) {
      this.snowMesh.visible = true;
      this.snowMat.opacity = THREE.MathUtils.lerp(this.snowMat.opacity, 0.85, delta * 0.5);
      this.updateSnowParticles(delta, playerPos);
    } else {
      this.snowMat.opacity = THREE.MathUtils.lerp(this.snowMat.opacity, 0.0, delta * 0.5);
      if (this.snowMat.opacity <= 0.02) {
        this.snowMesh.visible = false;
      }
    }
  }

  updateSnowParticles(delta, playerPos) {
    const pos = this.snowMesh.geometry.attributes.position;
    const count = pos.count;
    const cx = playerPos ? playerPos.x : 0;
    const cz = playerPos ? playerPos.z : 0;

    for (let i = 0; i < count; i++) {
      let py = pos.getY(i) - this.snowVelocities[i] * delta;
      let px = pos.getX(i) + Math.sin(py * 0.5 + i) * 0.08;

      if (py < 0) {
        py = 40 + Math.random() * 10;
        px = cx + (Math.random() - 0.5) * 120;
        pos.setZ(i, cz + (Math.random() - 0.5) * 120);
      }
      pos.setX(i, px);
      pos.setY(i, py);
    }
    pos.needsUpdate = true;
  }

  getCurrentSeason() {
    return this.currentSeason;
  }

  advanceSeason() {
    this.currentSeasonIndex = (this.currentSeasonIndex + 1) % 4;
    if (this.currentSeasonIndex === 0) {
      this.year += 1;
    }
    this.currentSeason = this.seasonOrder[this.currentSeasonIndex];

    globalEvents.emit('seasonChanged', {
      season: this.currentSeason,
      year: this.year,
      temperature: this.temperature
    });
    globalEvents.emit('season-changed', this.currentSeason);
  }

  getSeasonStatusString() {
    return `第 ${this.year} 年 · ${this.currentSeason.name} (${Math.round(this.temperature)}°C)`;
  }

  serialize() {
    return {
      currentSeasonIndex: this.currentSeasonIndex,
      year: this.year,
      seasonProgress: this.seasonProgress,
      temperature: this.temperature
    };
  }

  deserialize(data) {
    if (!data) return;
    this.currentSeasonIndex = data.currentSeasonIndex || 0;
    this.currentSeason = this.seasonOrder[this.currentSeasonIndex];
    this.year = data.year || 1;
    this.seasonProgress = data.seasonProgress || 0;
    this.temperature = data.temperature !== undefined ? data.temperature : this.currentSeason.temp;
  }
}
