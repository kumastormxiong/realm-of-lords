import { BUILDING_TYPES, RANKS } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';
import { ProfessionWindow } from './ProfessionWindow.js';
import { SaveModal } from './SaveModal.js';
import { CropModal } from './CropModal.js';
import { AchievementModal } from './AchievementModal.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // Submodals
    this.professionWindow = new ProfessionWindow(game.professionSystem);
    this.saveModal = new SaveModal(game.storageAdapter, game);
    this.cropModal = new CropModal(game.buildingManager);
    this.achievementModal = new AchievementModal(game.achievementManager);

    this.initLayout();
    this.bindEvents();
  }

  initLayout() {
    this.root = document.createElement('div');
    this.root.id = 'ui-root';
    this.root.innerHTML = `
      <!-- Top HUD Header -->
      <header class="top-hud ui-interactive">
        <div class="hud-left">
          <div class="hud-badge clock-badge" id="hud-clock">
            <span class="hud-icon">⏰</span>
            <span class="hud-value" id="val-time">08:30</span>
          </div>
          <div class="hud-badge season-badge" id="hud-season">
            <span class="hud-icon" id="val-season-icon">🌱</span>
            <span class="hud-value" id="val-season-text">春季 (15°C)</span>
          </div>
          <div class="hud-badge weather-badge" id="hud-weather">
            <span class="hud-icon">🌤️</span>
            <span class="hud-value" id="val-weather-text">晴朗</span>
          </div>
          <div class="hud-badge rank-badge" id="hud-rank" title="领主当前爵位">
            <span class="hud-icon">👑</span>
            <span class="hud-value" id="val-rank-text">荒野先锋小队长</span>
          </div>
        </div>

        <div class="hud-center">
          <div class="resource-pill" title="总人口及年龄结构">
            <span class="res-icon">👥</span>
            <span class="res-val" id="val-pop">12</span>
            <span class="res-sub" id="val-pop-sub">(幼0 / 少2 / 成8 / 老2)</span>
          </div>
          <div class="resource-pill" title="粮食储备（人均消耗，冬季备粮）">
            <span class="res-icon">🌾</span>
            <span class="res-val" id="val-food">150</span>
          </div>
          <div class="resource-pill" title="原木储备（建材与劈柴原料）">
            <span class="res-icon">🪵</span>
            <span class="res-val" id="val-wood">100</span>
          </div>
          <div class="resource-pill" title="石料储备（高级建筑与工坊）">
            <span class="res-icon">🪨</span>
            <span class="res-val" id="val-stone">50</span>
          </div>
          <div class="resource-pill" title="铁矿石（铁匠锻造原料）">
            <span class="res-icon">⛓️</span>
            <span class="res-val" id="val-iron">20</span>
          </div>
          <div class="resource-pill warm-pill" title="过冬木柴（严寒冬季消耗，不足将冻死）">
            <span class="res-icon">🪓</span>
            <span class="res-val" id="val-firewood">40</span>
          </div>
          <div class="resource-pill" title="铁制工具（提升劳动效率，无工具将受惩罚）">
            <span class="res-icon">⚒️</span>
            <span class="res-val" id="val-tools">15</span>
          </div>
          <div class="resource-pill happiness-pill" title="领民幸福度与健康度">
            <span class="res-icon">😊</span>
            <span class="res-val" id="val-happy">90%</span>
          </div>
        </div>

        <div class="hud-right">
          <!-- View switch buttons -->
          <div class="btn-group view-switcher">
            <button class="btn-tool active" id="btn-view-rts" title="鸟瞰视角 [V]">鸟瞰</button>
            <button class="btn-tool" id="btn-view-tp" title="第三人称领主 [V]">追随</button>
            <button class="btn-tool" id="btn-view-fp" title="第一人称进屋 [V]">漫游</button>
          </div>

          <!-- Speed control -->
          <div class="btn-group speed-controls">
            <button class="btn-tool" id="btn-speed-pause" title="暂停">⏸️</button>
            <button class="btn-tool active" id="btn-speed-1x" title="正常速度">1x</button>
            <button class="btn-tool" id="btn-speed-2x" title="加速 x2">2x</button>
            <button class="btn-tool" id="btn-speed-5x" title="极速 x5">5x</button>
          </div>

          <!-- Modals & Utilities -->
          <div class="btn-group">
            <button class="btn-hud" id="btn-open-prof" title="劳动力职业分工">📋 职业</button>
            <button class="btn-hud" id="btn-open-ach" title="个人成就系统">🏆 成就</button>
            <button class="btn-hud" id="btn-open-save" title="存档与云同步">💾 存档</button>
            <button class="btn-hud btn-icon-only" id="btn-toggle-sound" title="音量静音切换">🔊</button>
          </div>
        </div>
      </header>

      <!-- Center Crosshair & Interaction Tooltip for 1st-person view -->
      <div id="fp-crosshair" class="hidden"></div>
      <div id="interaction-prompt" class="interaction-prompt hidden">
        <span class="prompt-key">E</span> <span id="prompt-text">推门进入农舍</span>
      </div>

      <!-- Toast Notification Container -->
      <div id="toast-container" class="toast-stack"></div>

      <!-- Building Construction Dock -->
      <footer class="bottom-dock ui-interactive">
        <div class="dock-label">
          <span>🏛️ 营造司 · 建设领地</span>
          <span class="dock-cancel-hint hidden" id="dock-cancel-btn">点击空白处或按 [ESC] 取消建造</span>
        </div>
        <div class="building-card-track" id="building-cards">
          <!-- Dynamically populated from BUILDING_TYPES -->
        </div>
      </footer>
    `;

    document.body.appendChild(this.root);
    this.populateBuildingDock();
  }

  populateBuildingDock() {
    const track = this.root.querySelector('#building-cards');
    track.innerHTML = '';

    const types = [
      BUILDING_TYPES.COTTAGE,
      BUILDING_TYPES.FARM,
      BUILDING_TYPES.LUMBER,
      BUILDING_TYPES.WOODCUTTER,
      BUILDING_TYPES.BLACKSMITH,
      BUILDING_TYPES.QUARRY,
      BUILDING_TYPES.WELL,
      BUILDING_TYPES.GRANARY,
      BUILDING_TYPES.MANOR
    ];

    types.forEach(b => {
      const card = document.createElement('div');
      card.className = 'b-card';
      card.dataset.buildingId = b.id;

      let costStr = '';
      if (b.cost.wood > 0) costStr += `🪵${b.cost.wood} `;
      if (b.cost.stone > 0) costStr += `🪨${b.cost.stone} `;
      if (b.cost.iron > 0) costStr += `⛓️${b.cost.iron} `;
      if (!costStr) costStr = '免费';

      card.innerHTML = `
        <div class="b-name">${b.name}</div>
        <div class="b-cost">${costStr}</div>
        <div class="b-desc">${b.desc}</div>
      `;

      card.addEventListener('click', () => {
        if (this.game.buildingPlacementMode === b.id) {
          this.game.cancelPlacement();
        } else {
          this.game.startPlacement(b.id);
        }
      });

      track.appendChild(card);
    });
  }

  bindEvents() {
    // View Switch buttons
    const btnRts = this.root.querySelector('#btn-view-rts');
    const btnTp = this.root.querySelector('#btn-view-tp');
    const btnFp = this.root.querySelector('#btn-view-fp');

    btnRts.addEventListener('click', () => this.game.cameraController.setMode('RTS'));
    btnTp.addEventListener('click', () => this.game.cameraController.setMode('THIRD_PERSON'));
    btnFp.addEventListener('click', () => this.game.cameraController.setMode('FIRST_PERSON'));

    globalEvents.on('camera-mode-changed', (mode) => {
      btnRts.classList.toggle('active', mode === 'RTS');
      btnTp.classList.toggle('active', mode === 'THIRD_PERSON');
      btnFp.classList.toggle('active', mode === 'FIRST_PERSON');

      const crosshair = this.root.querySelector('#fp-crosshair');
      crosshair.classList.toggle('hidden', mode !== 'FIRST_PERSON');
    });

    // Speed controls
    const btnPause = this.root.querySelector('#btn-speed-pause');
    const btn1x = this.root.querySelector('#btn-speed-1x');
    const btn2x = this.root.querySelector('#btn-speed-2x');
    const btn5x = this.root.querySelector('#btn-speed-5x');

    const updateSpeedBtns = (sp) => {
      btnPause.classList.toggle('active', sp === 0);
      btn1x.classList.toggle('active', sp === 1);
      btn2x.classList.toggle('active', sp === 2);
      btn5x.classList.toggle('active', sp === 5);
    };

    btnPause.addEventListener('click', () => { this.game.setTimeSpeed(0); updateSpeedBtns(0); });
    btn1x.addEventListener('click', () => { this.game.setTimeSpeed(1); updateSpeedBtns(1); });
    btn2x.addEventListener('click', () => { this.game.setTimeSpeed(2); updateSpeedBtns(2); });
    btn5x.addEventListener('click', () => { this.game.setTimeSpeed(5); updateSpeedBtns(5); });

    // Modals
    this.root.querySelector('#btn-open-prof').addEventListener('click', () => this.professionWindow.open());
    this.root.querySelector('#btn-open-ach').addEventListener('click', () => this.achievementModal.open());
    this.root.querySelector('#btn-open-save').addEventListener('click', () => this.saveModal.open());

    // Sound toggle
    const soundBtn = this.root.querySelector('#btn-toggle-sound');
    soundBtn.addEventListener('click', () => {
      const isMuted = this.game.audioManager.toggleMute();
      soundBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    // Cancel building hint
    this.root.querySelector('#dock-cancel-btn').addEventListener('click', () => {
      this.game.cancelPlacement();
    });

    // Global Toasts
    globalEvents.on('toast', (toast) => this.showToast(toast));

    // Time & weather updates
    globalEvents.on('time-tick', (data) => {
      this.root.querySelector('#val-time').textContent = data.timeStr;
    });

    globalEvents.on('weather-changed', (weather) => {
      this.root.querySelector('#val-weather-text').textContent = weather.name;
    });

    globalEvents.on('season-changed', (season) => {
      const icon = season.id === 'WINTER' ? '❄️' : (season.id === 'AUTUMN' ? '🍂' : (season.id === 'SUMMER' ? '☀️' : '🌱'));
      this.root.querySelector('#val-season-icon').textContent = icon;
      this.root.querySelector('#val-season-text').textContent = `${season.name} (${season.temp}°C)`;
    });
  }

  update(economyState, seasonState, lordRank) {
    if (!economyState) return;

    const r = economyState.resources;
    const p = economyState.population;

    this.root.querySelector('#val-pop').textContent = p.total;
    this.root.querySelector('#val-pop-sub').textContent =
      `(幼${p.infants || 0}/少${p.children || 0}/青中${(p.youngAdults || 0) + (p.middleAged || 0)}/老${p.elders || 0})`;

    this.root.querySelector('#val-food').textContent = Math.floor(r.food);
    this.root.querySelector('#val-wood').textContent = Math.floor(r.wood);
    this.root.querySelector('#val-stone').textContent = Math.floor(r.stone);
    this.root.querySelector('#val-iron').textContent = Math.floor(r.iron);
    this.root.querySelector('#val-firewood').textContent = Math.floor(r.firewood);
    this.root.querySelector('#val-tools').textContent = Math.floor(r.tools);
    this.root.querySelector('#val-happy').textContent = `${Math.floor(r.happiness)}%`;

    // Lord Rank
    const rankObj = RANKS[Math.min(lordRank, RANKS.length - 1)];
    this.root.querySelector('#val-rank-text').textContent = rankObj.title;

    // Check affordability of building cards
    const cards = this.root.querySelectorAll('.b-card');
    cards.forEach(card => {
      const bId = card.dataset.buildingId;
      const bType = Object.values(BUILDING_TYPES).find(t => t.id === bId);
      if (bType) {
        const canAfford =
          r.wood >= bType.cost.wood &&
          r.stone >= bType.cost.stone &&
          r.iron >= bType.cost.iron;

        card.classList.toggle('unaffordable', !canAfford);
        card.classList.toggle('active', this.game.buildingPlacementMode === bId);
      }
    });

    // Toggle cancel button in dock
    const cancelBtn = this.root.querySelector('#dock-cancel-btn');
    cancelBtn.classList.toggle('hidden', !this.game.buildingPlacementMode);
  }

  showToast(toast) {
    const container = this.root.querySelector('#toast-container');
    const toastEl = document.createElement('div');
    toastEl.className = `toast-item toast-${toast.type || 'info'}`;
    toastEl.innerHTML = `<span>${toast.msg}</span>`;

    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.add('toast-fade');
      setTimeout(() => toastEl.remove(), 400);
    }, 4500);
  }

  setInteractionPrompt(visible, text = '') {
    const el = this.root.querySelector('#interaction-prompt');
    if (visible) {
      el.classList.remove('hidden');
      el.querySelector('#prompt-text').textContent = text;
    } else {
      el.classList.add('hidden');
    }
  }
}
