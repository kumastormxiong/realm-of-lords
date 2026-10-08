# 领主之境：庄园与边陲 (Realm of Lords: Frontier)

> ⚔️ 一款致敬《放逐之城》(Banished)、《庄园领主》(Manor Lords) 与《遥远边陲》(Farthest Frontier) 的纯原生 WebGL / Three.js 3D 中世纪城市建设与领主巡视独立游戏。无需任何插件，现代浏览器即点即玩！

---

## 🎮 在线试玩 (GitHub Pages)

👉 **立即在浏览器中畅玩**：[https://kumastormxiong.github.io/realm-of-lords/](https://kumastormxiong.github.io/realm-of-lords/)

---

## ✨ 核心特色与玩法

### 1. 👥 《放逐之城》硬核劳动力分工簿 (Workforce Allocation)
- 点击右上角【📋 职业】即可随时调配全村劳动力。
- **7大经典工种**：闲散机动劳工 (Laborer)、建筑工人 (Builder)、耕作农夫 (Farmer)、林区伐木工 (Lumberjack)、劈柴工 (Woodcutter)、铁匠 (Blacksmith)、采石矿工 (Miner)。
- **严冬休耕与机动调配**：冬季农田休耕，农夫自动转为全图物资搬运工；适时增调劈柴工以防止领民冻死。

### 2. ❄️ 四季更迭与严冬考验 (Four Seasons & Survival)
- **春季 · 融雪播种**：积雪消融，气温回升至 15°C，农田开始春耕。
- **夏季 · 茂盛丰稔**：草木繁茂，温度达 26°C，生产效率达到顶峰。
- **秋季 · 抢收备冬**：凉意渐起，产出 1.5 倍大丰收，抓紧储备粮食与木柴。
- **严冬 · 极寒凛冽**：大雪纷飞覆满整片大地，气温骤降至 -8°C，农舍壁炉全力消耗木柴取暖；若无充足木柴与粮食，领民将面临失温冻死与饥荒危机！

### 3. 🎥 三重视角自由切换 (Triple View Perspectives)
- **中世纪鸟瞰全局视角 (RTS / God-View)**：经典城建俯瞰，右键旋转、滚轮无级缩放，全景观摩领地城镇风貌。
- **领主第三人称追随视角 (3rd Person Lord Follow)**：追随玩家本人化身的领主角色，WASD 移动，Shift 冲刺，斗篷随风飘扬。
- **沉浸式第一人称视角 (1st Person Enterable Houses)**：亲自推开温馨农舍的大门，直接走进屋内，在噼啪作响的壁炉炉火前避风御寒！

### 4. 🌾 庄园农田与作物轮作规划 (Crop Selector)
- 点击建造好的任何一片农田，即可弹出作物规划面板。
- 自由切换 **冬小麦** (经典谷物，收成稳固)、**水田水稻** (近水丰产，产量极高)、**庄园蔬菜** (平稳生长，提供健康度)、**林地甜浆果** (提升幸福度)。

### 5. 👨‍👩‍👧‍👦 人口生命周期与拟真行为 AI (Demographics & Purposeful AI)
- 摒弃圆柱体几何人，采用多肤色、有衣着、有工具的精细人形模型。
- **全生命周期阶段**：婴儿 (襁褓)、少儿 (奔跑成长)、青壮年 (持农具/斧锤劳作)、老年 (持手杖缓步)。
- **目的性 AI 走向**：领民根据被分配的职业，真实走往农田、伐木场、劈柴棚、铁匠铺与采石矿；劳作完毕后返回农舍休息，严寒时主动靠近篝火壁炉取暖。
- 生老病死机制：老者自然寿终正寝，住房宽裕且粮食丰盛时诞生新生命。

### 6. ☀️ 24小时日月星辰与动态天气 (Astronomy & Dynamic Weather)
- 界面实时显示时间（如 `08:30`）。
- 天球运转：太阳从东侧升起，傍晚化作金黄余晖与落日霞光；夜晚降临后，满天繁星闪烁，皎洁明月当空照映。
- **多变天气**：晴朗无云、多云薄雾、细雨连绵、狂风雷暴（闪电瞬间照亮整片边境，伴随低沉雷鸣），冬季则漫天飞雪。

### 7. 👑 领主晋阶与爵位进阶外观 (Lord Rank Progression)
- 随着领地人口与规模扩大，领主身份从 **荒野先锋小队长** 一路晋升为 **拓荒小村领袖**、**庄园领主**、**边陲伯爵** 直至 **封国大公**！
- 领主 3D 外观动态进化：从简陋头箍猎装升级为精工镶边天鹅绒外套、银质肩甲、紫袍猩红披风，直至璀璨宝石王冠。

### 8. 🏆 领主个人成就系统 (Achievements)
- 涵盖【荒野筑居】、【五谷丰登】、【冬日薪火】、【百炼成钢】、【登堂入室】、【傲雪凌霜】、【守望星空】、【人丁兴旺】、【庄园霸业】等史诗成就，实时弹窗庆贺。

### 9. 💾 领地档案存读系统 (LocalStorage & Clerk/Supabase Ready)
- 完整的领地格局、人口构成、四季状态与资源进度的保存、读取与删除。
- 底层采用 `StorageAdapter` 模块化解耦架构，现阶段运行于 LocalStorage，已预留 Clerk 身份认证与 Supabase Postgres 云端同步插槽，方便后续跨端扩展。

---

## 📁 模块化项目架构

```text
├── index.html                   # 游戏入口主页（针对 GitHub Pages 优化）
├── README.md                    # 项目文档与介绍
├── .gitignore                   # Git 忽略配置
├── css/
│   └── ui.css                   # 中世纪羊皮纸 & 深岩暗色毛玻璃 UI 样式表
├── libs/
│   └── three.module.js          # 本地封装的 Three.js 核心库（脱离 CDN 依赖）
├── assets/
│   ├── audio/                   # 预留自定义音乐与音效文件夹（支持 .mp3/.ogg）
│   ├── models/                  # 预留外部 GLTF/GLB 3D 模型资产文件夹
│   └── textures/                # 预留外部贴图材质文件夹
└── src/
    ├── main.js                  # 入口启动引导脚本
    ├── core/
    │   ├── Constants.js         # 四季、作物、职业、建筑、爵位、成就全局定义
    │   ├── EventBus.js          # 解耦事件总线
    │   ├── StorageAdapter.js    # 存档抽象适配器（LocalStorage / Supabase Ready）
    │   └── Game.js              # 游戏主逻辑调度、动画主循环、射线投射
    ├── rendering/
    │   ├── Renderer.js          # WebGLRenderer、ACESFilmic 色调映射、PCF 阴影
    │   ├── CameraController.js  # RTS / 第三人称 / 第一人称无缝视点控制器
    │   ├── WeatherSystem.js     # 24H 昼夜日月轨迹、星空、雨雪雷暴天气系统
    │   └── SeasonSystem.js      # 四季气候轮替、地表积雪着色器与降雪粒子
    ├── environment/
    │   ├── Noise.js             # Simplex 2D/3D & FBM 柏林噪声发生器
    │   ├── TextureGenerator.js  # 程序化材质生成（树皮、树叶、石材、茅草、布料）
    │   ├── Terrain.js           # 程序化地形、峡谷河流、积雪与草地色彩混合
    │   └── FoliageManager.js    # 实例化橡树、松树、白桦树、果树、浆果丛与铁矿岩
    ├── entities/
    │   ├── LordCharacter.js     # 玩家领主 3D 化身、动态披风物理、爵位外观演进
    │   ├── VillagerManager.js   # 具有年龄段的拟真人性化领民、生老病死与目的性 AI
    │   └── BuildingManager.js   # 劈柴工坊、铁匠铺、可进入农舍等程序化建筑生成器
    ├── systems/
    │   ├── EconomySystem.js     # 资源产出、工具磨损、冬季采暖消耗与饥荒严寒判定
    │   ├── ProfessionSystem.js  # 类似放逐之城的劳动力配比与岗位平衡系统
    │   └── AchievementManager.js# 个人功勋成就判定与弹窗通报
    ├── audio/
    │   └── AudioManager.js      # 原生 Web Audio 中世纪鲁特琴旋律、风雨雷电音效与外部音频扩展钩子
    └── ui/
        ├── UIManager.js         # 顶部 HUD、状态栏、建造栏、准星与全局 Toast
        ├── ProfessionWindow.js  # 职业工种增减分配窗口
        ├── SaveModal.js         # 存档记录、加载与删除弹窗
        ├── CropModal.js         # 庄园农田作物轮作定制弹窗
        └── AchievementModal.js  # 领主史诗功勋成就典籍弹窗
```

---

## 🛠️ 本地运行开发

1. 克隆本仓库：
   ```bash
   git clone https://github.com/kumastormxiong/realm-of-lords.git
   cd realm-of-lords
   ```
2. 启动静态网页服务器（任意服务器均可）：
   ```bash
   # 使用 Python
   python -m http.server 8080

   # 或使用 Node.js npx serve
   npx serve .
   ```
3. 在浏览器打开 `http://localhost:8080` 即可开始游玩。

---

## 📜 许可证与鸣谢
本项目基于 MIT License 协议开源，致敬《放逐之城》、《庄园领主》与所有热爱中世纪城建游戏的开发者！
