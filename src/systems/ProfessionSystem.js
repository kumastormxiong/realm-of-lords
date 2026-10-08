import { PROFESSIONS } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';

export class ProfessionSystem {
  constructor(economySystem, buildingManager) {
    this.economySystem = economySystem;
    this.buildingManager = buildingManager;

    // Default workforce allocation
    this.allocations = {
      [PROFESSIONS.FARMER.id]: 2,
      [PROFESSIONS.LUMBERJACK.id]: 2,
      [PROFESSIONS.WOODCUTTER_WORKER.id]: 1,
      [PROFESSIONS.BLACKSMITH_WORKER.id]: 0,
      [PROFESSIONS.MINER.id]: 1,
      [PROFESSIONS.BUILDER.id]: 0
    };

    this.maxSlots = {
      [PROFESSIONS.FARMER.id]: 3,
      [PROFESSIONS.LUMBERJACK.id]: 3,
      [PROFESSIONS.WOODCUTTER_WORKER.id]: 2,
      [PROFESSIONS.BLACKSMITH_WORKER.id]: 2,
      [PROFESSIONS.MINER.id]: 3,
      [PROFESSIONS.BUILDER.id]: 6
    };
  }

  getWorkingAdultsCount() {
    if (!this.economySystem) return 6;
    const pop = this.economySystem.population;
    return (pop.youngAdults || 0) + (pop.middleAged || 0);
  }

  getAssignedCount() {
    return Object.values(this.allocations).reduce((sum, n) => sum + n, 0);
  }

  getLaborerCount() {
    const adults = this.getWorkingAdultsCount();
    return Math.max(0, adults - this.getAssignedCount());
  }

  getMaxSlots(professionId) {
    return this.maxSlots[professionId] || 4;
  }

  getAllocations() {
    return { ...this.allocations };
  }

  getSnapshot() {
    return {
      professions: { ...this.allocations },
      assigned: this.getAssignedCount(),
      totalWorkforce: this.getWorkingAdultsCount()
    };
  }

  updateMaxSlots() {
    if (!this.buildingManager) return;

    let farms = 0, lumbers = 0, woodcutters = 0, blacksmiths = 0, quarries = 0;
    for (const b of this.buildingManager.buildings) {
      const type = (b.typeKey || b.type || '').toUpperCase();
      if (type === 'FARM') farms++;
      else if (type === 'LUMBER') lumbers++;
      else if (type === 'WOODCUTTER') woodcutters++;
      else if (type === 'BLACKSMITH') blacksmiths++;
      else if (type === 'QUARRY') quarries++;
    }

    this.maxSlots[PROFESSIONS.FARMER.id] = Math.max(2, farms * 3);
    this.maxSlots[PROFESSIONS.LUMBERJACK.id] = Math.max(2, lumbers * 3);
    this.maxSlots[PROFESSIONS.WOODCUTTER_WORKER.id] = Math.max(1, woodcutters * 2);
    this.maxSlots[PROFESSIONS.BLACKSMITH_WORKER.id] = blacksmiths * 2;
    this.maxSlots[PROFESSIONS.MINER.id] = Math.max(1, quarries * 3);
    this.maxSlots[PROFESSIONS.BUILDER.id] = 6;

    globalEvents.emit('professions-updated', this.getSnapshot());
  }

  assign(professionId, count = 1) {
    if (this.allocations[professionId] === undefined) return false;

    const available = this.getLaborerCount();
    const max = this.getMaxSlots(professionId);
    const cur = this.allocations[professionId];

    const toAdd = Math.min(count, Math.min(available, max - cur));
    if (toAdd <= 0) return false;

    this.allocations[professionId] += toAdd;
    globalEvents.emit('professions-updated', this.getSnapshot());
    return true;
  }

  unassign(professionId, count = 1) {
    if (this.allocations[professionId] === undefined) return false;

    const cur = this.allocations[professionId];
    const toRemove = Math.min(count, cur);
    if (toRemove <= 0) return false;

    this.allocations[professionId] -= toRemove;
    globalEvents.emit('professions-updated', this.getSnapshot());
    return true;
  }

  serialize() {
    return { ...this.allocations };
  }

  deserialize(data) {
    if (data && typeof data === 'object') {
      Object.assign(this.allocations, data);
      globalEvents.emit('professions-updated', this.getSnapshot());
    }
  }
}
