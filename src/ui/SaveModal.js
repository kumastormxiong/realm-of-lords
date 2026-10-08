import { globalEvents } from '../core/EventBus.js';

export class SaveModal {
  constructor(storageAdapter, game) {
    this.storageAdapter = storageAdapter;
    this.game = game;
    this.isOpen = false;

    this.container = document.createElement('div');
    this.container.id = 'save-modal';
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
            <span class="modal-icon">💾</span>
            <h2>王国领地档案 · Save & Load Records</h2>
          </div>
          <button class="modal-close-btn" id="save-close-btn">&times;</button>
        </div>

        <div class="storage-badge-banner">
          <div class="storage-badge-tag">🔒 本地安全存储 (LocalStorage) 状态正常</div>
          <div class="storage-badge-note">
            已为后续架构预留 <strong>Clerk 身份认证</strong> 与 <strong>Supabase 云数据库</strong> 同步插槽，开通后支持多设备云端跨端游玩。
          </div>
        </div>

        <div class="save-slot-card" id="slot-1">
          <div class="slot-header">
            <span class="slot-name">👑 领主主线存档 (Slot 1)</span>
            <span class="slot-time" id="slot-1-time">暂无记录</span>
          </div>
          <div class="slot-preview" id="slot-1-preview">
            点击下方按钮将当前领地格局、人口、四季更迭与建筑保存至本地。
          </div>
          <div class="slot-actions">
            <button class="btn-primary" id="btn-save-slot1">保存当前领地</button>
            <button class="btn-secondary" id="btn-load-slot1">读取此存档</button>
            <button class="btn-danger" id="btn-del-slot1">删除此记录</button>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-hint">支持多次覆写；若清理浏览器缓存请提前注意备份。</div>
          <button class="btn-secondary" id="save-done-btn">返回游戏</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelector('#save-close-btn').addEventListener('click', () => this.close());
    this.container.querySelector('#save-done-btn').addEventListener('click', () => this.close());

    this.container.querySelector('#btn-save-slot1').addEventListener('click', async () => {
      if (!this.game) return;
      const data = this.game.serialize();
      const success = await this.storageAdapter.saveGame('slot1', data);
      if (success) {
        globalEvents.emit('toast', { type: 'success', msg: '领地进度已成功保存至本地！' });
        this.refreshSlotInfo();
      }
    });

    this.container.querySelector('#btn-load-slot1').addEventListener('click', async () => {
      if (!this.game) return;
      const data = await this.storageAdapter.loadGame('slot1');
      if (data) {
        this.game.deserialize(data);
        globalEvents.emit('toast', { type: 'success', msg: '存档已成功载入，领地重现昔日繁盛！' });
        this.close();
      } else {
        globalEvents.emit('toast', { type: 'warning', msg: '未检测到可用存档数据，请先保存。' });
      }
    });

    this.container.querySelector('#btn-del-slot1').addEventListener('click', async () => {
      const confirmDel = confirm('确定要删除此存档吗？删除后领地进度将无法复原。');
      if (confirmDel) {
        await this.storageAdapter.deleteSave('slot1');
        globalEvents.emit('toast', { type: 'info', msg: '该存档记录已清空。' });
        this.refreshSlotInfo();
      }
    });

    globalEvents.on('open-save-modal', () => this.open());
  }

  async open() {
    this.isOpen = true;
    this.container.classList.remove('hidden');
    await this.refreshSlotInfo();
  }

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  }

  async refreshSlotInfo() {
    const data = await this.storageAdapter.loadGame('slot1');
    const timeEl = this.container.querySelector('#slot-1-time');
    const prevEl = this.container.querySelector('#slot-1-preview');
    const loadBtn = this.container.querySelector('#btn-load-slot1');
    const delBtn = this.container.querySelector('#btn-del-slot1');

    if (data) {
      const dateStr = data.savedAt ? new Date(data.savedAt).toLocaleString() : '最近存档';
      timeEl.textContent = dateStr;
      prevEl.innerHTML = `
        <div class="slot-info-grid">
          <div>四季：<strong>${data.season?.current?.name || '春季'}</strong></div>
          <div>人口：<strong>${data.economy?.population?.total || 12} 人</strong></div>
          <div>粮食：<strong>${Math.floor(data.economy?.resources?.food || 0)}</strong></div>
          <div>木柴：<strong>${Math.floor(data.economy?.resources?.firewood || 0)}</strong></div>
          <div>建筑：<strong>${data.buildings?.length || 1} 座</strong></div>
        </div>
      `;
      loadBtn.disabled = false;
      delBtn.disabled = false;
    } else {
      timeEl.textContent = '暂无存档';
      prevEl.textContent = '暂无已保存的领地记录。点击左侧“保存当前领地”即可建立新的存档。';
      loadBtn.disabled = true;
      delBtn.disabled = true;
    }
  }
}
