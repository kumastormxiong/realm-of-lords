import * as THREE from '../../libs/three.module.js';
import { globalEvents } from '../core/EventBus.js';

export const WEATHER_TYPES = {
  SUNNY: { id: 'SUNNY', name: '晴朗无云', cloudCover: 0.05, rainIntensity: 0 },
  CLOUDY: { id: 'CLOUDY', name: '多云薄雾', cloudCover: 0.65, rainIntensity: 0 },
  RAIN: { id: 'RAIN', name: '细雨连绵', cloudCover: 0.9, rainIntensity: 0.6 },
  THUNDERSTORM: { id: 'THUNDERSTORM', name: '狂风雷暴', cloudCover: 1.0, rainIntensity: 1.0 }
};

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;

    // Time cycle: 24h cycle in seconds (240s = 24 in-game hours, 1h = 10s)
    this.dayDuration = 240.0;
    this.timeOfDay = 8.5; // Start at 8:30 AM
    this.timeScale = 1.0;

    // Weather state
    this.currentWeather = WEATHER_TYPES.SUNNY;
    this.weatherTimer = 0;
    this.weatherDuration = 90.0 + Math.random() * 60.0;

    // Lightning flash timer
    this.lightningTimer = 0;
    this.isFlashing = false;

    // Lighting setup
    this.setupLighting();
    this.setupCelestialObjects();
    this.setupRainParticles();
  }

  setupLighting() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    // Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;
    this.sunLight.shadow.camera.left = -75;
    this.sunLight.shadow.camera.right = 75;
    this.sunLight.shadow.camera.top = 75;
    this.sunLight.shadow.camera.bottom = -75;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // Moon Light
    this.moonLight = new THREE.DirectionalLight(0x7c9bc2, 0.22);
    this.scene.add(this.moonLight);

    // Hemisphere light for realistic sky/ground bounce
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d3527, 0.4);
    this.scene.add(this.hemiLight);
  }

  setupCelestialObjects() {
    // 1. Starry Sky (shimmering stars at night)
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Hemisphere distribution above horizon
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.48; // Upper hemisphere

      const r = 260.0;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi) + 10;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.6,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(starGeo, this.starMaterial);
    this.scene.add(this.starPoints);

    // 2. Moon Mesh
    const moonGeo = new THREE.SphereGeometry(6, 16, 16);
    this.moonMat = new THREE.MeshBasicMaterial({ color: 0xebf2fa });
    this.moonMesh = new THREE.Mesh(moonGeo, this.moonMat);
    this.scene.add(this.moonMesh);
  }

  setupRainParticles() {
    this.rainCount = 2500;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    this.rainSpeeds = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
      this.rainSpeeds[i] = 45.0 + Math.random() * 25.0;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainMaterial = new THREE.PointsMaterial({
      color: 0x9fb5c9,
      size: 0.65,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });

    this.rainPoints = new THREE.Points(rainGeo, this.rainMaterial);
    this.scene.add(this.rainPoints);
  }

  update(delta, seasonInfo = null) {
    // Advance time of day
    const hourDelta = (delta * this.timeScale / this.dayDuration) * 24.0;
    this.timeOfDay = (this.timeOfDay + hourDelta) % 24.0;

    // Weather transition logic
    this.weatherTimer += delta;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      this.weatherDuration = 70.0 + Math.random() * 60.0;
      this.pickNextWeather();
    }

    // Update Celestial Orbit & Lighting Colors
    this.updateSunAndSky(delta);

    // Update Rain / Snow Particles
    this.updatePrecipitation(delta, seasonInfo);

    // Thunderstorm lightning logic
    if (this.currentWeather === WEATHER_TYPES.THUNDERSTORM) {
      this.updateThunderstorm(delta);
    }

    // Emit time tick
    const hour = Math.floor(this.timeOfDay);
    const minute = Math.floor((this.timeOfDay % 1) * 60);
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const isNight = this.timeOfDay < 5.0 || this.timeOfDay > 19.5;

    globalEvents.emit('time-tick', {
      timeOfDay: this.timeOfDay,
      timeStr,
      hour,
      minute,
      isNight,
      weather: this.currentWeather
    });
  }

  pickNextWeather() {
    const r = Math.random();
    let next = WEATHER_TYPES.SUNNY;
    if (r < 0.45) next = WEATHER_TYPES.SUNNY;
    else if (r < 0.75) next = WEATHER_TYPES.CLOUDY;
    else if (r < 0.92) next = WEATHER_TYPES.RAIN;
    else next = WEATHER_TYPES.THUNDERSTORM;

    if (next !== this.currentWeather) {
      this.currentWeather = next;
      globalEvents.emit('weather-changed', this.currentWeather);
      globalEvents.emit('toast', {
        type: 'info',
        msg: `天气转变为：${this.currentWeather.name}`
      });
    }
  }

  updateSunAndSky(delta) {
    // Sun angle: 0 at midnight, PI at noon
    const sunAngle = ((this.timeOfDay - 6.0) / 24.0) * Math.PI * 2.0;

    const sunDist = 180.0;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = Math.sin(sunAngle * 0.5) * 60.0;

    this.sunLight.position.set(sunX, Math.max(-20, sunY), sunZ);
    this.sunLight.target.position.set(0, 0, 0);

    // Opposite Moon
    this.moonLight.position.set(-sunX, -sunY, -sunZ);
    this.moonLight.target.position.set(0, 0, 0);
    this.moonMesh.position.set(-sunX * 1.3, Math.max(-50, -sunY * 1.3), -sunZ * 1.3);

    // Sun altitude factor (0 = below horizon, 1 = high noon)
    const sunAlt = Math.max(0, Math.sin(sunAngle));

    // Dynamic sky colors based on sun altitude & weather
    let skyColor = new THREE.Color(0x87ceeb); // Bright azure noon
    let sunIntensity = 1.45 * sunAlt;
    let ambientIntensity = 0.45 * Math.max(0.18, sunAlt);

    if (sunAlt < 0.05) {
      // Night
      skyColor.setHex(0x040814); // Deep starry midnight
      ambientIntensity = 0.15;
      sunIntensity = 0.0;
      this.starMaterial.opacity = THREE.MathUtils.lerp(this.starMaterial.opacity, 0.92, delta * 3.0);
      this.moonMat.color.setHex(0xf0f4ff);
    } else if (sunAlt < 0.28) {
      // Golden hour / Dawn / Dusk
      skyColor.setHex(0xd47a46); // Rich amber sunset
      this.sunLight.color.setHex(0xffaa5e);
      ambientIntensity = 0.35;
      this.starMaterial.opacity = THREE.MathUtils.lerp(this.starMaterial.opacity, 0.0, delta * 4.0);
    } else {
      // Day
      skyColor.setHex(0x87ceeb);
      this.sunLight.color.setHex(0xfffaed);
      this.starMaterial.opacity = 0.0;
    }

    // Weather overcast modulations
    if (this.currentWeather === WEATHER_TYPES.CLOUDY) {
      skyColor.lerp(new THREE.Color(0x9aa6b3), 0.65);
      sunIntensity *= 0.6;
      ambientIntensity *= 0.85;
    } else if (this.currentWeather === WEATHER_TYPES.RAIN) {
      skyColor.lerp(new THREE.Color(0x56606c), 0.85);
      sunIntensity *= 0.25;
      ambientIntensity *= 0.65;
    } else if (this.currentWeather === WEATHER_TYPES.THUNDERSTORM) {
      skyColor.lerp(new THREE.Color(0x23272e), 0.95);
      sunIntensity *= 0.1;
      ambientIntensity *= 0.45;
    }

    this.sunLight.intensity = sunIntensity;
    this.ambientLight.intensity = ambientIntensity;
    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color = skyColor;
    }
  }

  updatePrecipitation(delta, seasonInfo) {
    const isRaining = this.currentWeather.rainIntensity > 0;
    const isSnow = seasonInfo && seasonInfo.temp < 0;

    const targetOpacity = isRaining ? (isSnow ? 0.85 : 0.65) : 0.0;
    this.rainMaterial.opacity = THREE.MathUtils.lerp(this.rainMaterial.opacity, targetOpacity, delta * 2.0);

    if (this.rainMaterial.opacity <= 0.01) return;

    if (isSnow) {
      this.rainMaterial.color.setHex(0xffffff);
      this.rainMaterial.size = 1.1;
    } else {
      this.rainMaterial.color.setHex(0x9fb5c9);
      this.rainMaterial.size = 0.65;
    }

    const pos = this.rainPoints.geometry.attributes.position.array;
    for (let i = 0; i < this.rainCount; i++) {
      const fallSpeed = isSnow ? 14.0 : this.rainSpeeds[i];
      pos[i * 3 + 1] -= fallSpeed * delta;

      // Slight wind drift
      pos[i * 3] += (isSnow ? Math.sin(pos[i * 3 + 1] * 0.1) * 3.0 : 4.0) * delta;

      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 55.0 + Math.random() * 10.0;
        pos[i * 3] = (Math.random() - 0.5) * 160;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
      }
    }
    this.rainPoints.geometry.attributes.position.needsUpdate = true;
  }

  updateThunderstorm(delta) {
    this.lightningTimer += delta;
    if (this.lightningTimer > 8.0 + Math.random() * 10.0) {
      this.lightningTimer = 0;
      this.triggerLightning();
    }
  }

  triggerLightning() {
    this.isFlashing = true;
    this.sunLight.intensity = 4.2;
    this.ambientLight.intensity = 2.5;
    this.scene.background = new THREE.Color(0xf5f8ff);

    globalEvents.emit('thunder', {});

    setTimeout(() => {
      if (this.sunLight) this.sunLight.intensity = 0.1;
      if (this.ambientLight) this.ambientLight.intensity = 0.35;
      this.isFlashing = false;
    }, 120);
  }
}
