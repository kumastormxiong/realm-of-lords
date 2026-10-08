import { CROP_TYPES } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';

export class CropModal {
  constructor(buildingManager) {
    this.buildingManager = buildingManager;
    this.currentFarm = null;
    this.isOpen = false;

    this.container = document.createElement('div');
    this.container.id = 'crop-modal';
    this.container.className = 'medieval-modal hidden';
    document.body.appendChild(this.container);

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">🌾</span>
            <h2>庄园农田 · 作物轮作规划</h2>
          </div>
          <button class="modal-close-btn" id="crop-close-btn">&times;</button>
        </div>

        <div class="modal-subtitle">
          选择本片农田本年度种植的作物类别。水稻需水量大但产量极高，小麦耐寒保质期长。
        </div>

        <div class="crop-grid" id="crop-grid">
          <!-- Dynamically generated -->
        </div>

        <div class="modal-footer">
          <div class="footer-hint">提示：在秋季收获之前更换作物将清空当季生长进度。</div>
          <button class="btn-secondary" id="crop-cancel-btn">取消</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelector('#crop-close-btn').addEventListener('click', () => this.close());
    this.container.querySelector('#crop-cancel-btn').addEventListener('click', () => this.close());

    globalEvents.on('open-crop-selector', (farmBuilding) => {
      this.open(farmBuilding);
    });
  }

  open(farmBuilding) {
    this.currentFarm = farmBuilding;
    this.isOpen = true;
    this.container.classList.remove('hidden');
    this.updateGrid();
  }

  close() {
    this.isOpen = false;
    this.currentFarm = null;
    this.container.classList.add('hidden');
  }

  updateGrid() {
    const grid = this.container.querySelector('#crop-grid');
    const curType = this.currentFarm ? (this.currentFarm.cropType || 'WHEAT') : 'WHEAT';

    let html = '';
    for (const key of Object.keys(CROP_TYPES)) {
      const crop = CROP_TYPES[key];
      const isSelected = crop.id === curType;

      html += `
        <div class="crop-card ${isSelected ? 'selected' : ''}" data-crop="${crop.id}">
          <div class="crop-icon">${crop.icon}</div>
          <div class="crop-name">${crop.name}</div>
          <div class="crop-yield">预期基础单产：<strong>${crop.yield}</strong> 单位</div>
          <div class="crop-desc">${crop.desc}</div>
          <button class="btn-select-crop ${isSelected ? 'active' : ''}">
            ${isSelected ? '当前种植中' : '指定种植'}
          </button>
        </div>
      `;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.crop-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedId = card.dataset.crop;
        if (this.currentFarm && this.buildingManager) {
          this.buildingManager.setFarmCrop(this.currentFarm, selectedId);
          globalEvents.emit('toast', {
            type: 'success',
            msg: `已将该农田指定为种植：${CROP_TYPES[selectedId].name}`
          });
        }
        this.close();
      });
    });
  }
}
