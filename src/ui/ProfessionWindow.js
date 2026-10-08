import { PROFESSIONS } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';

export class ProfessionWindow {
  constructor(professionSystem) {
    this.professionSystem = professionSystem;
    this.isOpen = false;

    this.container = document.createElement('div');
    this.container.id = 'profession-window';
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
            <span class="modal-icon">📋</span>
            <h2>领民职业分工簿 · Labor Allocation</h2>
          </div>
          <button class="modal-close-btn" id="prof-close-btn">&times;</button>
        </div>

        <div class="modal-subtitle">
          放逐之城核心机制：根据季节与生产需求，随时平衡劳工、农夫、劈柴工与铁匠的劳动力。
        </div>

        <div class="workforce-summary" id="prof-summary">
          <!-- Injected dynamically -->
        </div>

        <div class="profession-list" id="prof-list">
          <!-- Injected dynamically -->
        </div>

        <div class="modal-footer">
          <div class="footer-hint">提示：冬季农田休耕，农夫会自动转为搬运劳工；务必确保劈柴工人数充足！</div>
          <button class="btn-primary" id="prof-confirm-btn">确认分配</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelector('#prof-close-btn').addEventListener('click', () => this.close());
    this.container.querySelector('#prof-confirm-btn').addEventListener('click', () => this.close());

    globalEvents.on('professions-updated', () => {
      if (this.isOpen) {
        this.updateContent();
      }
    });

    globalEvents.on('open-professions', () => this.open());
  }

  open() {
    this.isOpen = true;
    this.container.classList.remove('hidden');
    this.updateContent();
  }

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  }

  updateContent() {
    const summaryEl = this.container.querySelector('#prof-summary');
    const listEl = this.container.querySelector('#prof-list');

    const totalPop = this.professionSystem.economySystem ? this.professionSystem.economySystem.population.total : 0;
    const workingAdults = this.professionSystem.getWorkingAdultsCount();
    const freeLaborers = this.professionSystem.getLaborerCount();

    summaryEl.innerHTML = `
      <div class="summary-stat">
        <span class="stat-label">总领民数</span>
        <span class="stat-val">${totalPop} 人</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">可劳动成人</span>
        <span class="stat-val highlight">${workingAdults} 人</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">机动搬运劳工</span>
        <span class="stat-val gold">${freeLaborers} 人</span>
      </div>
    `;

    const allocations = this.professionSystem.getAllocations();
    const keys = Object.keys(PROFESSIONS).filter(k => k !== 'LABORER');

    let rowsHtml = '';
    for (const key of keys) {
      const p = PROFESSIONS[key];
      const assigned = allocations[key] || 0;
      const maxSlots = this.professionSystem.getMaxSlots(key);

      rowsHtml += `
        <div class="prof-row" data-id="${key}">
          <div class="prof-info">
            <span class="prof-icon">${p.icon}</span>
            <div class="prof-text">
              <div class="prof-name">${p.name}</div>
              <div class="prof-desc">${p.desc}</div>
            </div>
          </div>
          <div class="prof-controls">
            <button class="btn-counter btn-minus" data-key="${key}" ${assigned <= 0 ? 'disabled' : ''}>-</button>
            <span class="prof-count-display">${assigned} <span class="prof-max">/ ${maxSlots}</span></span>
            <button class="btn-counter btn-plus" data-key="${key}" ${freeLaborers <= 0 || assigned >= maxSlots ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `;
    }

    listEl.innerHTML = rowsHtml;

    // Attach counter click listeners
    listEl.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const k = e.currentTarget.dataset.key;
        this.professionSystem.unassign(k, 1);
        this.updateContent();
      });
    });

    listEl.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const k = e.currentTarget.dataset.key;
        this.professionSystem.assign(k, 1);
        this.updateContent();
      });
    });
  }
}
