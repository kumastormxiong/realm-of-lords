import { ACHIEVEMENTS } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';

export class AchievementManager {
  constructor() {
    this.achievements = ACHIEVEMENTS;
    this.unlocked = new Set();

    this.bindEvents();
  }

  bindEvents() {
    globalEvents.on('building-built', (building) => {
      if (building.type === 'cottage') {
        this.unlock('h1');
      } else if (building.type === 'farm') {
        this.unlock('farm');
      } else if (building.type === 'manor') {
        this.unlock('manor');
      }
    });

    globalEvents.on('season-changed', (season) => {
      if (season.id === 'SPRING') {
        // Just survived winter
        this.unlock('winter_survive');
      }
    });

    globalEvents.on('time-tick', (data) => {
      if (data.isNight && data.hour >= 0 && data.hour <= 4) {
        this.unlock('stars');
      }
    });

    globalEvents.on('population-updated', (pop) => {
      if (pop.total >= 50) {
        this.unlock('pop50');
      }
    });
  }

  checkEconomy(economyState) {
    if (economyState.resources.firewood >= 50) {
      this.unlock('firewood');
    }
    if (economyState.resources.tools >= 25) {
      this.unlock('tools');
    }
  }

  unlock(id) {
    if (this.unlocked.has(id)) return;

    const ach = this.achievements.find(a => a.id === id);
    if (!ach) return;

    this.unlocked.add(id);

    globalEvents.emit('achievement-unlocked', ach);
    globalEvents.emit('toast', {
      type: 'achievement',
      msg: `🏆 成就达成！【${ach.title}】 - ${ach.desc}`
    });
  }

  getProgress() {
    return {
      unlockedCount: this.unlocked.size,
      totalCount: this.achievements.length,
      list: this.achievements.map(a => ({
        ...a,
        isUnlocked: this.unlocked.has(a.id)
      }))
    };
  }

  serialize() {
    return Array.from(this.unlocked);
  }

  deserialize(data) {
    if (Array.isArray(data)) {
      this.unlocked = new Set(data);
    }
  }
}
