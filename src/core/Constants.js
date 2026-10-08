/**
 * Global Constants & Configurations for Realm of Lords: Frontier
 */

export const SEASONS = {
  SPRING: { id: 'SPRING', name: '春季 · 融雪播种', temp: 15, snowCoverage: 0.1, foodMult: 1.0, firewoodBurnRate: 0.5 },
  SUMMER: { id: 'SUMMER', name: '夏季 · 茂盛丰稔', temp: 26, snowCoverage: 0.0, foodMult: 1.3, firewoodBurnRate: 0.1 },
  AUTUMN: { id: 'AUTUMN', name: '秋季 · 抢收备冬', temp: 10, snowCoverage: 0.0, foodMult: 1.5, firewoodBurnRate: 0.8 },
  WINTER: { id: 'WINTER', name: '严冬 · 极寒凛冽', temp: -8, snowCoverage: 1.0, foodMult: 0.0, firewoodBurnRate: 2.2 }
};

export const CROP_TYPES = {
  WHEAT: { id: 'WHEAT', name: '冬小麦', icon: '🌾', yield: 6.5, desc: '经典谷物，收成丰厚，适合制作耐储存面包。' },
  RICE: { id: 'RICE', name: '水田水稻', icon: '🍚', yield: 7.5, desc: '水田稻谷，饱腹感高，近水丰产。' },
  VEGETABLES: { id: 'VEGETABLES', name: '庄园蔬菜', icon: '🥬', yield: 6.0, desc: '卷心菜与块茎，生长周期平稳，富含营养。' },
  BERRIES: { id: 'BERRIES', name: '林地甜浆果', icon: '🍓', yield: 5.5, desc: '甘甜可口，提供糖分并显著提升领民幸福度。' }
};

export const PROFESSIONS = {
  LABORER:            { id: 'LABORER',            name: '闲散劳工', icon: '📦', desc: '全图搬运物资、清理原木石料与杂务。' },
  BUILDER:            { id: 'BUILDER',            name: '建筑工人', icon: '🔨', desc: '前往新规划建筑地基搬运建材并进行搭建。' },
  FARMER:             { id: 'FARMER',             name: '耕作农夫', icon: '🌾', desc: '春夏秋季在农田精耕细作，冬季转为劳工。' },
  LUMBERJACK:         { id: 'LUMBERJACK',         name: '伐木工',   icon: '🌲', desc: '在林区伐木场持续采伐原木。' },
  WOODCUTTER_WORKER:  { id: 'WOODCUTTER_WORKER',  name: '劈柴工',   icon: '🪓', desc: '将原木劈削为过冬必备木柴。' },
  BLACKSMITH_WORKER:  { id: 'BLACKSMITH_WORKER',  name: '铁匠',     icon: '⚒️', desc: '利用原木与铁矿石锻造铁制工具。' },
  MINER:              { id: 'MINER',              name: '采石矿工', icon: '⛏️', desc: '在采石场与露天矿点开采坚硬石料与铁矿。' }
};

export const BUILDING_TYPES = {
  OUTPOST: {
    id: 'outpost',
    name: '先锋哨所营火',
    cost: { wood: 0, stone: 0, iron: 0 },
    housing: 6,
    size: 6,
    desc: '初始领地核心，提供温暖篝火与基础避难空间。'
  },
  COTTAGE: {
    id: 'cottage',
    name: '温馨避寒农舍',
    cost: { wood: 15, stone: 5, iron: 0 },
    housing: 5,
    size: 4,
    desc: '带有温暖壁炉的半木结构民居，冬季消耗木柴供暖，可亲自进入。'
  },
  FARM: {
    id: 'farm',
    name: '精耕庄园农田',
    cost: { wood: 20, stone: 10, iron: 0 },
    housing: 0,
    size: 6,
    desc: '划定耕地，点击可自由选择种植小麦、水稻、蔬菜或浆果。'
  },
  LUMBER: {
    id: 'lumber',
    name: '伐木营地',
    cost: { wood: 20, stone: 0, iron: 0 },
    housing: 0,
    size: 5,
    desc: '派驻伐木工人，自动砍伐周围森林获取原木。'
  },
  WOODCUTTER: {
    id: 'woodcutter',
    name: '劈柴工坊',
    cost: { wood: 25, stone: 8, iron: 0 },
    housing: 0,
    size: 4,
    desc: '【放逐之城核心】将原木劈成过冬木柴，防止居民在寒冬冻死！'
  },
  BLACKSMITH: {
    id: 'blacksmith',
    name: '锻造铁匠铺',
    cost: { wood: 30, stone: 20, iron: 10 },
    housing: 0,
    size: 5,
    desc: '【放逐之城核心】锻造铁制工具，避免工人工具磨损耗尽导致效率减半！'
  },
  QUARRY: {
    id: 'quarry',
    name: '石匠采石场',
    cost: { wood: 25, stone: 5, iron: 0 },
    housing: 0,
    size: 5,
    desc: '开采天然岩石矿，源源不断地产出坚固石料与铁矿石。'
  },
  WELL: {
    id: 'well',
    name: '石砌清泉水井',
    cost: { wood: 10, stone: 15, iron: 0 },
    housing: 0,
    size: 3,
    desc: '提供甘甜饮用水，显著提升周围居民的幸福度与防火安全。'
  },
  GRANARY: {
    id: 'granary',
    name: '领地大谷仓',
    cost: { wood: 40, stone: 20, iron: 5 },
    housing: 0,
    size: 5,
    desc: '高垫防潮防鼠大谷仓，大幅提升粮食、木柴与工具的仓储上限。'
  },
  MANOR: {
    id: 'manor',
    name: '领主庄园城堡',
    cost: { wood: 80, stone: 80, iron: 25 },
    housing: 15,
    size: 8,
    desc: '宏伟石筑大厅与领主旌旗，象征真正的封建领主权威！'
  }
};

export const RANKS = [
  { tier: 1, title: '荒野先锋小队长', enTitle: 'Outpost Captain', popReq: 8, desc: '在篝火旁建立营地，解决最初拓荒者的温饱与原木供应。' },
  { tier: 2, title: '拓荒小村领袖', enTitle: 'Village Elder', popReq: 20, desc: '农舍错落有致，劈柴工坊与铁匠铺落成，村民推举你为村庄领袖！' },
  { tier: 3, title: '庄园领主', enTitle: 'Manor Lord', popReq: 60, desc: '粮仓充实，拔地而起的领主庄园城堡奠定了你不可动摇的贵族权威！' },
  { tier: 4, title: '边陲伯爵', enTitle: 'Borderland Count', popReq: 200, desc: '数百领民在此安居乐业，道路四通八达，成为整片边境的统治核心！' },
  { tier: 5, title: '封国大公', enTitle: 'Grand Duke', popReq: 600, desc: '万民敬仰，城邑绵延，数以千计的臣民向你屈膝行礼！' }
];

export const ACHIEVEMENTS = [
  { id: 'h1', title: '荒野筑居', desc: '建造第一座属于领民的避寒农舍。', icon: '🏡' },
  { id: 'farm', title: '五谷丰登', desc: '开垦第一处庄园农田并自选种植作物。', icon: '🌾' },
  { id: 'firewood', title: '冬日薪火', desc: '建造劈柴工坊，储备超过 50 份过冬木柴。', icon: '🪓' },
  { id: 'tools', title: '百炼成钢', desc: '落成铁匠铺，成功锻造出第一批铁工具。', icon: '⚒️' },
  { id: 'enter', title: '登堂入室', desc: '亲自走进一栋农舍温暖的壁炉前避风雨。', icon: '🔥' },
  { id: 'winter_survive', title: '傲雪凌霜', desc: '带领村民成功熬过一场滴水成冰的严寒寒冬！', icon: '❄️' },
  { id: 'stars', title: '守望星空', desc: '在午夜仰望漫天繁星与皎洁明月。', icon: '✨' },
  { id: 'pop50', title: '人丁兴旺', desc: '全村人口突破 50 人。', icon: '👥' },
  { id: 'manor', title: '庄园霸业', desc: '落成雄伟石筑领主城堡，敕封为庄园领主！', icon: '🏰' }
];
