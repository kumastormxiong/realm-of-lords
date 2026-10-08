import { RANKS } from '../core/Constants.js';
import { globalEvents } from '../core/EventBus.js';

export class EconomySystem {
  constructor(seasonSystem) {
    this.seasonSystem = seasonSystem;
    this.buildingManager = null;
    this.professionSystem = null;

    // Banished Resource Pools
    this.resources = {
      wood: 75,
      stone: 35,
      iron: 15,
      firewood: 60,
      tools: 15,
      food: 120,
      happiness: 90,
      health: 95
    };

    // Storage capacity
    this.storageLimit = 300;

    // Population demographics
    this.population = {
      total: 12,
      infants: 2,
      children: 2,
      youngAdults: 4,
      middleAged: 2,
      elders: 2,
      laborers: 4,
      maxCapacity: 16
    };

    this.tickTimer = 0;
    this.tickInterval = 1.0;
  }

  // Getters for direct property access
  get wood() { return this.resources.wood; }
  set wood(v) { this.resources.wood = v; }
  get stone() { return this.resources.stone; }
  set stone(v) { this.resources.stone = v; }
  get iron() { return this.resources.iron; }
  set iron(v) { this.resources.iron = v; }
  get firewood() { return this.resources.firewood; }
  set firewood(v) { this.resources.firewood = v; }
  get tools() { return this.resources.tools; }
  set tools(v) { this.resources.tools = v; }
  get food() { return this.resources.food; }
  set food(v) { this.resources.food = v; }
  get happiness() { return this.resources.happiness; }
  set happiness(v) { this.resources.happiness = v; }
  get health() { return this.resources.health; }
  set health(v) { this.resources.health = v; }

  canAfford(cost) {
    if (!cost) return true;
    if (cost.wood && this.resources.wood < cost.wood) return false;
    if (cost.stone && this.resources.stone < cost.stone) return false;
    if (cost.iron && this.resources.iron < cost.iron) return false;
    return true;
  }

  deductCost(cost) {
    if (!cost) return;
    if (cost.wood) this.resources.wood = Math.max(0, this.resources.wood - cost.wood);
    if (cost.stone) this.resources.stone = Math.max(0, this.resources.stone - cost.stone);
    if (cost.iron) this.resources.iron = Math.max(0, this.resources.iron - cost.iron);
    this.emitState();
  }

  spendResources(cost) {
    this.deductCost(cost);
  }

  updateMaxHousing(buildings) {
    if (!buildings) return;
    let cap = 6; // Base campfire capacity
    let granaries = 0;

    for (const b of buildings) {
      const type = (b.typeKey || b.type || '').toUpperCase();
      if (type === 'COTTAGE') cap += 5;
      else if (type === 'MANOR') cap += 15;
      else if (type === 'GRANARY') granaries += 1;
    }

    this.population.maxCapacity = cap;
    this.storageLimit = 300 + granaries * 250;
  }

  update(delta, seasonInfo) {
    this.tickTimer += delta;
    if (this.tickTimer >= this.tickInterval) {
      this.tickTimer = 0;
      this.economicTick(seasonInfo);
    }
  }

  economicTick(seasonInfo) {
    const season = seasonInfo || (this.seasonSystem ? this.seasonSystem.getCurrentSeason() : { id: 'SPRING', temp: 15, foodMult: 1.0, firewoodBurnRate: 0.5 });
    const pSnap = this.professionSystem ? this.professionSystem.getSnapshot() : { professions: {}, assigned: 0 };

    // Tool efficiency factor: 1.0 with iron tools, 0.55 if tools are broken/0
    const toolEfficiency = this.resources.tools > 0 ? 1.0 : 0.55;

    // 1. Lumberjacks -> Wood
    const lumberjacks = pSnap.professions['LUMBERJACK'] || 0;
    const woodOutput = lumberjacks * 1.5 * toolEfficiency;
    this.resources.wood = Math.min(this.storageLimit, this.resources.wood + woodOutput);

    // 2. Woodcutters -> Firewood (logs -> firewood)
    const woodcutters = pSnap.professions['WOODCUTTER_WORKER'] || 0;
    if (woodcutters > 0 && this.resources.wood >= 1.0) {
      const woodToChop = Math.min(this.resources.wood, woodcutters * 0.9 * toolEfficiency);
      this.resources.wood -= woodToChop;
      this.resources.firewood = Math.min(this.storageLimit, this.resources.firewood + woodToChop * 2.5);
    }

    // 3. Miners -> Stone & Iron
    const miners = pSnap.professions['MINER'] || 0;
    const stoneOutput = miners * 1.1 * toolEfficiency;
    const ironOutput = miners * 0.35 * toolEfficiency;
    this.resources.stone = Math.min(this.storageLimit, this.resources.stone + stoneOutput);
    this.resources.iron = Math.min(this.storageLimit, this.resources.iron + ironOutput);

    // 4. Blacksmith -> Tools (wood + iron -> tools)
    const blacksmiths = pSnap.professions['BLACKSMITH_WORKER'] || 0;
    if (blacksmiths > 0 && this.resources.wood >= 1.0 && this.resources.iron >= 0.5) {
      this.resources.wood -= 0.6;
      this.resources.iron -= 0.35;
      this.resources.tools = Math.min(this.storageLimit, this.resources.tools + 0.45 * toolEfficiency);
    }

    // 5. Farmers -> Food (seasonal output)
    const farmers = pSnap.professions['FARMER'] || 0;
    if (season.id !== 'WINTER' && farmers > 0) {
      let farmBonus = 1.0;
      if (this.buildingManager) {
        for (const b of this.buildingManager.buildings) {
          const type = (b.typeKey || b.type || '').toUpperCase();
          if (type === 'FARM') {
            if (b.cropType === 'RICE') farmBonus += 0.35;
            else if (b.cropType === 'VEGETABLES') farmBonus += 0.25;
            else if (b.cropType === 'BERRIES') farmBonus += 0.2;
            else farmBonus += 0.3; // Wheat
          }
        }
      }
      const foodOutput = farmers * 1.7 * farmBonus * season.foodMult * toolEfficiency;
      this.resources.food = Math.min(this.storageLimit, this.resources.food + foodOutput);
    }

    // 6. Population Consumption
    const pop = this.population.total;
    const foodConsumed = pop * 0.32;
    this.resources.food = Math.max(0, this.resources.food - foodConsumed);

    // Winter firewood heating
    const firewoodConsumed = season.firewoodBurnRate * (pop * 0.22);
    this.resources.firewood = Math.max(0, this.resources.firewood - firewoodConsumed);

    // Tool wear & tear
    const activeWorkers = pSnap.assigned || 0;
    this.resources.tools = Math.max(0, this.resources.tools - activeWorkers * 0.02);

    // 7. Survival & Happiness checks
    if (season.id === 'WINTER' && this.resources.firewood <= 0) {
      this.resources.happiness = Math.max(10, this.resources.happiness - 4);
      this.resources.health = Math.max(20, this.resources.health - 2);
    } else if (this.resources.food <= 0) {
      this.resources.happiness = Math.max(10, this.resources.happiness - 5);
      this.resources.health = Math.max(20, this.resources.health - 3);
    } else {
      this.resources.happiness = Math.min(100, this.resources.happiness + 0.5);
      this.resources.health = Math.min(100, this.resources.health + 0.3);
    }

    this.emitState();
  }

  emitState() {
    globalEvents.emit('economy-updated', {
      resources: this.resources,
      population: this.population,
      storageLimit: this.storageLimit
    });
  }

  serialize() {
    return {
      resources: { ...this.resources },
      storageLimit: this.storageLimit,
      population: { ...this.population }
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.resources) Object.assign(this.resources, data.resources);
    if (data.storageLimit) this.storageLimit = data.storageLimit;
    if (data.population) Object.assign(this.population, data.population);
    this.emitState();
  }
}
