import { globalEvents } from '../core/EventBus.js';

export class AchievementModal {
  constructor(achievementManager) {
    this.achievementManager = achievementManager;
    this.isOpen = false;

    this.container = document.createElement('div');
    this.container.id = 'achievement-modal';
    this.container.className = 'medieval-modal hidden';
    document.body.appendChild(this.container);

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-card modal-wide">
        <div class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">🏆</span>
            <h2>领主荣耀 · 个人史诗成就</h2>
          </div>
          <button class="modal-close-btn" id="ach-close-btn">&times;</button>
        </div>

        <div class="achievement-progress-bar-wrap">
          <div class="ach-progress-header">
            <span>领主功勋达成度</span>
            <span id="ach-progress-text">0 / 9</span>
          </div>
          <div class="ach-progress-track">
            <div class="ach-progress-fill" id="ach-progress-fill" style="width: 0%"></div>
          </div>
        </div>

        <div class="achievement-grid" id="ach-grid">
          <!-- Dynamically populated -->
        </div>

        <div class="modal-footer">
          <button class="btn-primary" id="ach-done-btn">荣归领地</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelector('#ach-close-btn').addEventListener('click', () => this.close());
    this.container.querySelector('#ach-done-btn').addEventListener('click', () => this.close());

    globalEvents.on('open-achievements', () => this.open());
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
    const progress = this.achievementManager.getProgress();
    const pct = Math.round((progress.unlockedCount / progress.totalCount) * 100);

    this.container.querySelector('#ach-progress-text').textContent = `${progress.unlockedCount} / ${progress.totalCount} (${pct}%)`;
    this.container.querySelector('#ach-progress-fill').style.width = `${pct}%`;

    const grid = this.container.querySelector('#ach-grid');
    let html = '';

    for (const ach of progress.list) {
      const cls = ach.isUnlocked ? 'ach-card unlocked' : 'ach-card locked';
      html += `
        <div class="${cls}">
          <div class="ach-card-icon">${ach.icon}</div>
          <div class="ach-card-content">
            <div class="ach-card-title">
              <span>${ach.title}</span>
              <span class="ach-status-badge">${ach.isUnlocked ? '已达成' : '未解锁'}</span>
            </div>
            <div class="ach-card-desc">${ach.desc}</div>
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;
  }
}
