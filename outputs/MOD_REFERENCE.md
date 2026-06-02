# 农场增量 Mod 开发参考文档

> 版本 1.0 | 农场增量引擎 v2

---

## 1. DataRegistry 注册 API

所有模组内容通过 DataRegistry 注册。**不要直接修改全局变量**。

`javascript
// DataRegistry — 数据注册中心（支持 Mod 启用/禁用）
var DataRegistry = (function() {
    var _data = {};
    var _order = {};
    var _disabledMods = {};  // { modId: true } 禁用的 Mod
    
    function _ensure(cat) {
        if (!_data[cat]) { _data[cat] = {}; _order[cat] = []; }
    }
    
    function _isDisabled(def) {
        return def.__modId && _disabledMods[def.__modId];
    }
    
    return {
        register: function(cat, def, opts) {
            _ensure(cat);
            var id = def.id;
            if (!id) { console.warn("DataRegistry: missing id", cat, def); return; }
            if (opts && opts.modId) def.__modId = opts.modId;
            _data[cat][id] = def;
            if (_order[cat].indexOf(id) === -1) _order[cat].push(id);
        },
        registerAll: function(cat, defs) {
            for (var i = 0; i < defs.length; i++) {
                DataRegistry.register(cat, defs[i]);
            }
        },
        get: function(cat, id) {
            return (_data[cat] && _data[cat][id]) || null;
        },
        all: function(cat) {
            if (!_data[cat]) return [];
            var result = [];
            for (var i = 0; i < _order[cat].length; i++) {
                var def = _data[cat][_order[cat][i]];
                if (!_isDisabled(def)) result.push(def);
            }
            return result;
        },
        filter: function(cat, fn) {
            return DataRegistry.all(cat).filter(fn);
        },
        ids: function(cat) {
            if (!_data[cat]) return [];
            var result = [];
            for (var i = 0; i < _order[cat].length; i++) {
                var def = _data[cat][_order[cat][i]];
                if (!_isDisabled(def)) result.push(def.id);
            }
            return result;
        },
        override: function(cat, def) {
            _ensure(cat);
            _data[cat][def.id] = def;
            if (_order[cat].indexOf(def.id) === -1) _order[cat].push(def.id);
        },
        has: function(cat, id) {
            return !!(_data[cat] && _data[cat][id]);
        },
        count: function(cat) {
            return DataRegistry.ids(cat).length;
        },
        remove: function(cat, id) {
            if (_data[cat]) delete _data[cat][id];
            if (_order[cat]) {
                var idx = _order[cat].indexOf(id);
                if (idx !== -1) _order[cat].splice(idx, 1);
            }
        },
        // Mod 管理
        enableMod: function(modId) {
            delete _disabledMods[modId];
        },
        disableMod: function(modId) {
            _disabledMods[modId] = true;
        },
        setEnabledMods: function(modIds) {
            _disabledMods = {};
            if (window.__modManifest) {
                for (var i = 0; i < window.__modManifest.length; i++) {
                    var mid = window.__modManifest[i].id;
                    if (modIds.indexOf(mid) === -1) _disabledMods[mid] = true;
                }
            }
        },
        dump: function(cat) {
            if (cat) {
                var obj = {};
                var ids = DataRegistry.ids(cat);
                for (var i = 0; i < ids.length; i++) {
                    obj[ids[i]] = JSON.parse(JSON.stringify(_data[cat][ids[i]]));
                }
                return obj;
            }
            return JSON.parse(JSON.stringify(_data));
        }
    };
})();
`

---

## 2. 可注册的数据类型与关键字段

### crop（作物）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 英文下划线唯一标识 |
| n | string | ✓ | 中文名称 |
| i | string | ✓ | emoji 图标 |
| g | number | ✓ | 生长时间（秒） |
| v | number | ✓ | 出售单价（金币） |
| unlock | number | ✓ | 累计金币阈值 |
| soil | string |  | 偏好土壤ID（旧格式） |
| specialSoils | array |  | 多土壤偏好 [{soil,mult}] |
| specialSeasons | array |  | 季节偏好 [{season,mult}] |
| harvestCount | number |  | 收获产出数（默认2） |
| isHybrid | boolean |  | 杂交品种标记 |

### hybrid（杂交品种）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 亲本合成ID，如 carrot_pumpkin |
| p | [string,string] | ✓ | 两个亲本作物ID |
| ch | number | ✓ | 触发概率 0~1 |
| g/v/unlock/harvestCount/specialSoils/specialSeasons |  |  | 同 crop |

### animal（动物）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 英文标识 |
| n | string | ✓ | 名称 |
| i | string | ✓ | 图标 |
| c | number | ✓ | 购买价格 |
| p | object | ✓ | 产物 {n,i,t(产出间隔秒),v(价值),k(库存key)} |
| am | number | ✓ | 好感度上限 |
| unlock | number | ✓ | 解锁金币阈值 |

### processor（加工设施）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| n/i | string | ✓ | 名称/图标 |
| c | number | ✓ | 建造价格 |
| inp | object | ✓ | 输入 {k(库存key), n(名称)} |
| out | object | ✓ | 输出 {k, n, i, v(价值)} |
| t | number | ✓ | 加工时间（秒） |
| unlock | number | ✓ | 解锁阈值 |

### upgrade（科技升级）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| n/i/d | string | ✓ | 名称/图标/描述 |
| c | number | ✓ | 购买价格（金币） |
| ef | string | ✓ | 效果类型枚举（见第3节） |
| v | number |  | 效果数值 |
| unlock | number |  | 解锁金币阈值（0=研究解锁） |
| reqUpgrade | string |  | 前置升级ID |
| reqResearch | string |  | 前置研究ID |

### gemUpgrade（宝石升级）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| n/i/d | string | ✓ | 名称/图标/描述 |
| c | number | ✓ | 宝石价格 |
| ef | string | ✓ | 效果类型 |
| v | number |  | 效果数值 |
| req | string |  | 前置宝石升级ID |
| repeatable | boolean |  | 可重复购买 |
| costGrowth | number |  | 每次购买后价格增幅 |

### research（研究项目）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| n/i/desc | string | ✓ | 名称/图标/描述 |
| cost | object | ✓ | 消耗 {资源key:数量} |
| requires | [string] |  | 前置研究ID列表 |
| unlocks | [object] | ✓ | 解锁 [{type,id}] type: upgrade/crop/resource/story/region |

### achievement（成就）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| n/i/d | string | ✓ | 名称/图标/描述 |
| check | function | ✓ | 返回 true 时完成 |
| rewardGems | number | ✓ | 奖励宝石数 |

### event（随机事件）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| n/i/d | string | ✓ | 名称/图标/描述 |
| ef | function | ✓ | 触发效果函数，可操作 GS |
| weight | number | ✓ | 触发权重（越大越频繁） |

### relic（遗物）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| n/i/d | string | ✓ | 名称/图标/描述 |
| ef | string | ✓ | 效果类型 |
| v | number | ✓ | 效果值 |

### story（故事碎片）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| t | string | ✓ | 标题 |
| x | string | ✓ | 正文 |
| trigger | function | ✓ | 返回 true 时解锁 |

---

## 3. ef 效果类型枚举

| ef 值 | 说明 | 可用类型 |
|-------|------|---------|
| autoPlant | 自动播种 | upgrade |
| grow | 生长速度（v=比例） | upgrade, gemUpgrade |
| ignoreSeason | 无视季节 | upgrade |
| autoHarvest | 自动收获 | upgrade |
| fullAuto | 全自动（播+收） | upgrade |
| hybridChance | 杂交概率倍率 | upgrade, gemUpgrade |
| animalAff | 动物好感增加 | upgrade, gemUpgrade |
| animalDouble | 翻倍产出概率 | gemUpgrade |
| processSpeed | 加工时间减少 | gemUpgrade |
| stormResist | 暴风雨减免 | upgrade |
| greenhouseBonus | 温室额外加成 | upgrade |
| animalOutput | 动物产出+1 | upgrade |
| harvestPlus | 收获数量+N | upgrade, gemUpgrade, relic |
| seedDiscount | 种子消耗减少 | relic |
| seedKeep | 转生保留种子 | gemUpgrade |
| cropValue | 出售价值提升 | relic |
| sellValue | 出售价值提升 | gemUpgrade |
| weatherResist | 不利天气减半 | relic |
| weatherBoost | 晴雨天翻倍 | gemUpgrade |
| bgSpeed | 后台速率增加 | gemUpgrade |
| relicChance | 遗物概率增加 | gemUpgrade |
| hybridHarvest | 杂交品收获+1 | gemUpgrade |

---

## 4. 现有数据（完整参考）

### data/achievements.js

`javascript
// 成就定义
DataRegistry.registerAll("achievement", [
    {id:"first_harvest",   n:"第一次收获", d:"收获第一棵作物",              t:1, ch:function(){return GS.totalCropsHarvested>=1;}},
    {id:"harvest_50",      n:"勤劳农民",   d:"累计收获50次",                t:2, ch:function(){return GS.totalCropsHarvested>=50;}},
    {id:"harvest_200",     n:"丰收大师",   d:"累计收获200次",               t:3, ch:function(){return GS.totalCropsHarvested>=200;}},
    {id:"harvest_1000",    n:"农业之王",   d:"累计收获1000次",              t:4, ch:function(){return GS.totalCropsHarvested>=1000;}},
    {id:"harvest_5000",    n:"丰收之神",   d:"累计收获5000次",              t:5, ch:function(){return GS.totalCropsHarvested>=5000;}},
    {id:"coins_1000",      n:"小康之家",   d:"累计获得1000金币",            t:1, ch:function(){return GS.totalCoinsEarned>=1000;}},
    {id:"coins_10000",     n:"农场大亨",   d:"累计获得10000金币",           t:2, ch:function(){return GS.totalCoinsEarned>=10000;}},
    {id:"coins_100000",    n:"百万富翁",   d:"累计获得100000金币",          t:3, ch:function(){return GS.totalCoinsEarned>=100000;}},
    {id:"coins_1000000",   n:"富甲一方",   d:"累计获得1000000金币",         t:4, ch:function(){return GS.totalCoinsEarned>=1000000;}},
    {id:"coins_10000000",  n:"农场帝国",   d:"累计获得10000000金币",        t:5, ch:function(){return GS.totalCoinsEarned>=10000000;}},
    {id:"first_animal",    n:"动物伙伴",   d:"购买第一只动物",              t:1, ch:function(){return GS.totalAnimalsRaised>=1;}},
    {id:"animals_10",      n:"牧场主",     d:"累计饲养10只动物",            t:3, ch:function(){return GS.totalAnimalsRaised>=10;}},
    {id:"animals_50",      n:"动物园长",   d:"累计饲养50只动物",            t:5, ch:function(){return GS.totalAnimalsRaised>=50;}},
    {id:"first_upgrade",   n:"科技兴农",   d:"购买第一个升级",              t:1, ch:function(){for(var k in GS.upgrades){if(GS.upgrades[k])return true;}return false;}},
    {id:"all_upgrades",    n:"全自动化",   d:"购买所有升级",                t:4, ch:function(){var k=DataRegistry.ids("upgrade");for(var i=0;i<k.length;i++){if(!GS.upgrades[k[i]])return false;}return true;}},
    {id:"first_prestige",  n:"新的开始",   d:"完成第一次转生",              t:3, ch:function(){return GS.prestigePoints>=1;}},
    {id:"prestige_5",      n:"轮回之旅",   d:"累计获得5个农场之星",         t:4, ch:function(){return GS.prestigePoints>=5;}},
    {id:"prestige_20",     n:"永恒农者",   d:"累计获得20个农场之星",        t:5, ch:function(){return GS.prestigePoints>=20;}},
    {id:"all_crops",       n:"植物学家",   d:"发现所有基础作物",            t:3, ch:function(){var k=DataRegistry.ids("crop");for(var i=0;i<k.length;i++){if(GS.discoveredCrops.indexOf(k[i])===-1)return false;}return true;}},
    {id:"first_hybrid",    n:"基因工程师", d:"培育出第一个杂交作物",        t:3, ch:function(){return GS.discoveredHybrids.length>=1;}},
    {id:"all_hybrids",     n:"杂交大师",   d:"培育出所有杂交作物",          t:5, ch:function(){return GS.discoveredHybrids.length>=DataRegistry.count("hybrid");}},
    {id:"all_animals",     n:"动物学家",   d:"饲养过所有种类动物",          t:3, ch:function(){var k=DataRegistry.ids("animal");for(var i=0;i<k.length;i++){if(GS.discoveredAnimals.indexOf(k[i])===-1)return false;}return true;}},
    {id:"season_cycle",    n:"四季轮回",   d:"经历完整的四季循环",          t:1, ch:function(){return GS.year>1;}},
    {id:"seeds_1000",      n:"种子大亨",   d:"拥有1000颗种子",              t:3, ch:function(){return (GS.inventory.seeds||0)>=1000;}},
    {id:"all_processors",  n:"工业巨头",   d:"拥有所有加工设施",            t:3, ch:function(){var k=DataRegistry.ids("processor");for(var i=0;i<k.length;i++){if(!GS.processors[k[i]]||!GS.processors[k[i]].owned)return false;}return true;}},
    {id:"max_processor",   n:"自动化大师", d:"任意加工设施达到5级",         t:4, ch:function(){for(var k in GS.processors){if(GS.processors[k]&&GS.processors[k].level>=5)return true;}return false;}},
    {id:"land_10",         n:"大地主",     d:"拥有10块土地",                t:3, ch:function(){var c=0;for(var i=0;i<GS.land.length;i++){if(GS.land[i].unlocked)c++;}return c>=10;}},
    {id:"land_20",         n:"领土之王",   d:"拥有20块土地",                t:5, ch:function(){var c2=0;for(var i=0;i<GS.land.length;i++){if(GS.land[i].unlocked)c2++;}return c2>=20;}},
    {id:"relic_1",         n:"考古学家",   d:"发现第一个遗物",              t:3, ch:function(){return (GS.relics||[]).length>=1;}},
    {id:"relic_5",         n:"遗物收集者", d:"发现5个遗物",                 t:4, ch:function(){return (GS.relics||[]).length>=5;}},
    {id:"relic_all",       n:"文明追溯者", d:"发现全部遗物",                t:5, ch:function(){return (GS.relics||[]).length>=DataRegistry.count("relic");}},
    {id:"speed_run",       n:"速通达人",   d:"1年内完成首次转生",           t:4, ch:function(){return GS.prestigePoints>=1&&GS.year<=2;}},
    {id:"all_stories",     n:"故事收集者", d:"收集所有故事碎片",            t:4, ch:function(){return GS.storyFragments.length>=DataRegistry.count("story");}}
]);
`

### data/animals.js

`javascript
// 动物定义
DataRegistry.registerAll("animal", [
    {id:"chicken", n:"鸡", i:"🐔", c:200,  p:{n:"鸡蛋", i:"🥚", t:120, v:15,  k:"egg"},    am:100, unlock:800},
    {id:"cow",     n:"牛", i:"🐮", c:800,  p:{n:"牛奶", i:"🥛", t:200, v:40,  k:"milk"},   am:120, unlock:4000},
    {id:"sheep",   n:"羊", i:"🐑", c:2000, p:{n:"羊毛", i:"🧶", t:250, v:60,  k:"wool"},   am:100, unlock:12000},
    {id:"pig",     n:"猪", i:"🐷", c:5000, p:{n:"松露", i:"🍄", t:350, v:150, k:"truffle"}, am:80,  unlock:30000}
]);
`

### data/crops.js

`javascript
﻿// 基础作物定义
// specialSoils: [{soil, mult}] — 特殊土壤加成，不在列表中的土壤默认 x1.0
// specialSeasons: [{season, mult}] — 特殊季节加成，不在列表中的季节默认 x1.0
// harvestCount: 每次收获产量，默认2
DataRegistry.registerAll("crop", [
    {id:"wheat",     n:"小麦",   i:"🌾",   g:60,  v:10,  specialSoils:[],                                                specialSeasons:[{season:"spring",mult:1.3}],               harvestCount:3, unlock:0},
    {id:"carrot",    n:"胡萝卜", i:"🥕",   g:90,  v:16,  specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"spring",mult:1.2}],               harvestCount:2, unlock:500},
    {id:"potato",    n:"土豆",   i:"🥔",   g:120, v:25,  specialSoils:[{soil:"clay",mult:1.5}],                          specialSeasons:[{season:"winter",mult:1.4}],               harvestCount:3, unlock:2000},
    {id:"tomato",    n:"番茄",   i:"🍅",   g:150, v:35,  specialSoils:[],                                                specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:2, unlock:5000},
    {id:"corn",      n:"玉米",   i:"🌽",   g:180, v:50,  specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"summer",mult:1.4}],               harvestCount:3, unlock:12000},
    {id:"strawberry",n:"草莓",   i:"🍓",   g:210, v:70,  specialSoils:[{soil:"dark",mult:1.5}],                          specialSeasons:[{season:"spring",mult:1.2}],               harvestCount:4, unlock:30000},
    {id:"pumpkin",   n:"南瓜",   i:"🎃",   g:260, v:100, specialSoils:[{soil:"dark",mult:1.5}],                          specialSeasons:[{season:"autumn",mult:1.4}],               harvestCount:2, unlock:70000},
    {id:"watermelon",n:"西瓜",   i:"🍉",   g:320, v:160, specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:2, unlock:200000},
    {id:"blueberry", n:"蓝莓",   i:"🫐",   g:200, v:60,  specialSoils:[{soil:"dark",mult:1.5}],                          specialSeasons:[],                                        harvestCount:5, unlock:60000},
    {id:"sunflower", n:"向日葵", i:"🌻",   g:160, v:45,  specialSoils:[],                                                specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:2, unlock:35000},
    {id:"grape",     n:"葡萄",   i:"🍇",   g:280, v:130, specialSoils:[{soil:"clay",mult:1.5}],                          specialSeasons:[{season:"autumn",mult:1.3}],               harvestCount:3, unlock:150000},
    {id:"pepper",    n:"辣椒",   i:"🌶️",  g:140, v:40,  specialSoils:[{soil:"sand",mult:1.5}],                          specialSeasons:[{season:"summer",mult:1.3}],               harvestCount:3, unlock:40000}
]);
`

### data/events.js

`javascript
// 随机事件定义
DataRegistry.registerAll("event", [
    {id:"rain_bless",    n:"天降甘霖",i:"🌧️",   d:"雨水滋润了土地！",                    ef:function(){GS.weatherTimer=60;GS.weather="rainy";}},
    {id:"rabbit_raid",   n:"兔子来袭",i:"🐰",   d:"兔子偷吃了一些作物，但留下了兔毛可卖钱。", ef:function(){GS.coins+=Math.floor(Math.random()*200)+50;for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(s.crop&&Math.random()<0.15)s.crop.timer=Math.max(0,s.crop.timer-30);}notify("兔子留下了兔毛，+"+(Math.floor(Math.random()*200)+50)+"💰");}},
    {id:"double_value",  n:"双倍市价日",i:"💰", d:"市场行情大涨！60秒内收获价值翻倍。",      ef:function(){window._doubleValue=true;window._doubleValueEnd=Date.now()+60000;setTimeout(function(){window._doubleValue=false;window._doubleValueEnd=0;},60000);}},
    {id:"mystic_merch",  n:"神秘商人",i:"🧙",   d:"一位神秘商人高价收购你的产品！",          ef:function(){var b=Math.floor(Math.random()*1000)+300;GS.coins+=b;GS.totalCoinsEarned+=b;notify("神秘商人给了你 "+b+"💰");}},
    {id:"seed_bag",      n:"发现种子袋",i:"🌱", d:"在田地边缘发现了被遗忘的种子！",          ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+8;notify("获得 8 颗种子！");}},
    {id:"friendly_neigh",n:"友善的邻居",i:"👨‍🌾", d:"邻居老张送来了他培育的新品种！",           ef:function(){var allCrops=DataRegistry.ids("crop");var undiscovered=[];for(var i=0;i<allCrops.length;i++){if(GS.discoveredCrops.indexOf(allCrops[i])===-1)undiscovered.push(allCrops[i]);}if(undiscovered.length>0){var pick=undiscovered[Math.floor(Math.random()*undiscovered.length)];GS.discoveredCrops.push(pick);notify("解锁新作物："+DataRegistry.get("crop",pick).n);}else{GS.inventory.seeds=(GS.inventory.seeds||0)+20;notify("获得 20 颗种子！");}}},
    {id:"pest_invasion", n:"害虫入侵",i:"🐛",   d:"一群害虫袭击了农场，部分作物受损！",      ef:function(){for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(s.crop&&Math.random()<0.2)s.crop.timer=Math.max(0,s.crop.timer-60);}notify("害虫被驱散了，但一些作物受到了损伤。");}},
    {id:"land_collapse", n:"土地塌陷",i:"🕳️",   d:"一块田地发生了塌陷！",                    ef:function(){for(var i=GS.land.length-1;i>=0;i--){if(GS.land[i].unlocked&&!GS.land[i].crop&&Math.random()<0.3){GS.land[i].unlocked=false;notify("一块土地塌陷了，需要重新解锁！");return;}}notify("地面震动了一下，但幸好没有土地受损。");}},
    {id:"bird_raid",     n:"鸟群来袭",i:"🐦",   d:"鸟群袭击了农田！种子被偷吃了。",          ef:function(){var lost=Math.floor(Math.random()*5)+1;GS.inventory.seeds=Math.max(0,(GS.inventory.seeds||0)-lost);notify("鸟群偷吃了 "+lost+" 颗种子！");}},
    {id:"tool_sale",     n:"农具促销",i:"🔧",   d:"镇上农具店大促销！升级成本临时降低。",     ef:function(){window._toolDiscount=true;setTimeout(function(){window._toolDiscount=false;},60000);}},
    {id:"plant_mutation",n:"植物突变",i:"🧬",   d:"一株作物发生了奇怪的变化，价值暴增！",     ef:function(){for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(s.crop&&Math.random()<0.3){var cd=DataRegistry.get("crop",s.crop.id);var bonus=cd?cd.v*2:80;GS.coins+=bonus;GS.totalCoinsEarned+=bonus;notify("突变作物价值 "+bonus+"💰！");return;}}notify("空气中弥漫着奇怪的味道，但什么也没发生。");}},
    {id:"harvest_fest",  n:"丰收庆典",i:"🎉",   d:"村民们举办丰收庆典，送来了礼物！",        ef:function(){GS.inventory.seeds=(GS.inventory.seeds||0)+15;GS.coins+=200;GS.totalCoinsEarned+=200;notify("获得 15 颗种子 + 200💰！");}},
    {id:"harvest_goddess",n:"丰收女神的祝福",i:"✨",d:"丰收女神赐福！所有作物加速生长。",      ef:function(){for(var i=0;i<GS.land.length;i++){var s=GS.land[i];if(s.crop)s.crop.timer+=60;}notify("丰收女神加速了所有作物的生长！");}}
]);
`

### data/gems.js

`javascript
// 宝石升级定义
DataRegistry.registerAll("gemUpgrade", [
    {id:"greenFinger",   n:"绿手指",     i:"🌱", d:"生长速度+8%",    c:3,  ef:"grow",          v:0.08},
    {id:"greenFinger2",  n:"绿手指进阶", i:"🌿", d:"生长+12%",      c:8,  ef:"grow",          v:0.12, req:"greenFinger"},
    {id:"harvestBless",  n:"丰收赐福",   i:"📦", d:"收获量2→3",     c:8,  ef:"harvestPlus",   v:1},
    {id:"harvestBless2", n:"丰收赐福II", i:"📦", d:"收获量3→4",     c:20, ef:"harvestPlus",   v:1,    req:"harvestBless"},
    {id:"animalWhisper", n:"动物低语",   i:"🐾", d:"好感+20%",      c:3,  ef:"animalAff",     v:0.2},
    {id:"animalFriend",  n:"动物之友",   i:"🐄", d:"15%翻倍产出",   c:6,  ef:"animalDouble",  v:0.15},
    {id:"craftMaster",   n:"精工巧匠",   i:"⚙️", d:"加工时间-20%",  c:4,  ef:"processSpeed",  v:0.2},
    {id:"luckyCharm",    n:"幸运青睐",   i:"🍀", d:"杂交概率+30%",  c:5,  ef:"hybridChance",  v:0.3},
    {id:"relicSense",    n:"遗物感知",   i:"🗿", d:"遗物概率+50%",  c:5,  ef:"relicChance",   v:0.5},
    {id:"photosynthesis",n:"光合作用",   i:"🌤️",d:"晴/雨天增益翻倍", c:6, ef:"weatherBoost"},
    {id:"prestigeFeed",  n:"转生馈赠",   i:"🔄", d:"转生保留50%种子",c:8, ef:"seedKeep",      v:0.5},
    {id:"timeHourglass", n:"时光沙漏",   i:"⏰", d:"后台速率+50%",  c:10, ef:"bgSpeed",       v:0.5},
    {id:"goldenLegend",  n:"金色传说",   i:"🌟", d:"出售价值+20%",  c:20, ef:"sellValue",     v:0.2},
    {id:"rareBreed",     n:"稀有品种",   i:"🦄", d:"杂交品收获量+1",c:20, ef:"hybridHarvest", v:1},
    {id:"refineMaster",  n:"精益求精",   i:"📐", d:"生长速度+10%",  c:3,  ef:"grow",          v:0.10, repeatable:true, costGrowth:4}
]);
`

### data/hybrids.js

`javascript
﻿// 杂交品种定义
DataRegistry.registerAll("hybrid", [
    {id:"carrot_pumpkin",    n:"金色胡萝卜", i:"✨🥕", p:["carrot","pumpkin"],      ch:0.15, v:120, g:280, specialSoils:[{soil:"dark",mult:1.5}], specialSeasons:[],                  harvestCount:2, unlock:50000},
    {id:"corn_blueberry",    n:"紫玉米",     i:"🫐🌽", p:["corn","blueberry"],      ch:0.12, v:100, g:240, specialSoils:[{soil:"dark",mult:1.5}], specialSeasons:[],                  harvestCount:2, unlock:60000},
    {id:"tomato_pepper",     n:"火焰番茄",   i:"🔥🍅", p:["tomato","pepper"],       ch:0.10, v:90,  g:200, specialSoils:[{soil:"sand",mult:1.5}], specialSeasons:[],                  harvestCount:2, unlock:45000},
    {id:"wheat_sunflower",   n:"金穗麦",     i:"🌟🌾", p:["wheat","sunflower"],     ch:0.08, v:150, g:300, specialSoils:[],                    specialSeasons:[{season:"summer",mult:1.2}], harvestCount:2, unlock:80000},
    {id:"pumpkin_grape",     n:"宝石南瓜",   i:"💎🎃", p:["pumpkin","grape"],       ch:0.10, v:180, g:350, specialSoils:[{soil:"dark",mult:1.5}], specialSeasons:[],                  harvestCount:2, unlock:100000},
    {id:"watermelon_strawberry",n:"草莓西瓜", i:"🍓🍉", p:["watermelon","strawberry"],ch:0.08, v:200, g:380, specialSoils:[{soil:"dark",mult:1.5}], specialSeasons:[],                  harvestCount:2, unlock:150000}
]);
`

### data/processors.js

`javascript
// 加工设施定义
DataRegistry.registerAll("processor", [
    {id:"mill",         n:"磨坊",     i:"🏭", c:400,   inp:{k:"wheat",n:"小麦"},       out:{k:"flour",n:"面粉",i:"🌾📦",v:20},   t:30, unlock:1000},
    {id:"bakery",       n:"面包房",   i:"🍞", c:2000,  inp:{k:"flour",n:"面粉"},       out:{k:"bread",n:"面包",i:"🍞",v:60},      t:45, unlock:5000},
    {id:"dairy",        n:"奶酪坊",   i:"🧀", c:4000,  inp:{k:"milk",n:"牛奶"},        out:{k:"cheese",n:"奶酪",i:"🧀",v:100},    t:50, unlock:12000},
    {id:"loom",         n:"织布机",   i:"🧵", c:15000, inp:{k:"wool",n:"羊毛"},        out:{k:"cloth",n:"布料",i:"👘",v:150},     t:60, unlock:60000},
    {id:"smoker",       n:"熏制坊",   i:"🔥", c:20000, inp:{k:"pumpkin",n:"南瓜"},     out:{k:"smoked_pumpkin",n:"烟熏南瓜",i:"🔥🎃",v:200}, t:60, unlock:100000},
    {id:"brewery",      n:"酿酒坊",   i:"🍺", c:25000, inp:{k:"corn",n:"玉米"},        out:{k:"corn_wine",n:"玉米酒",i:"🍺🌽",v:180},   t:55, unlock:120000},
    {id:"jam_kitchen",  n:"果酱工坊", i:"🍯", c:30000, inp:{k:"strawberry",n:"草莓"},  out:{k:"strawberry_jam",n:"草莓果酱",i:"🍯🍓",v:220}, t:50, unlock:150000}
]);
`

### data/regions.js

`javascript
﻿// 地域定义
// soil: 该地域的土壤类型
// startUnlocked: 是否开局解锁
// priceA, priceB: 第x块地的价格 = a*x + b
// startLands: 开局免费解锁地块数
DataRegistry.registerAll("region", [
    {id:"plain",    n:"平原",     i:"🌾", soil:"normal", startUnlocked:true,  priceA:200,  priceB:0,   startLands:1},
    {id:"sandland", n:"沙地",     i:"🏜️", soil:"sand",   startUnlocked:true,  priceA:400,  priceB:200, startLands:1},
    {id:"darkland", n:"黑土平原", i:"🌑", soil:"dark",   startUnlocked:true,  priceA:600,  priceB:400, startLands:1},
    {id:"clayhill", n:"黏土山",   i:"⛰️", soil:"clay",   startUnlocked:true,  priceA:500,  priceB:300, startLands:1}
]);
`

### data/relics.js

`javascript
// 遗物定义
DataRegistry.registerAll("relic", [
    {id:"ancient_hoe",      n:"远古石锄",   i:"🪨", d:"所有作物价值+15%",   ef:"cropValue",     v:0.15},
    {id:"fertility_totem",  n:"丰收图腾",   i:"🗿", d:"生长速度+25%",       ef:"grow",          v:0.25},
    {id:"golden_sickle",    n:"黄金镰刀",   i:"🔱", d:"收获时获得产物+1",   ef:"harvestPlus",   v:1},
    {id:"weather_vane",     n:"风向标",     i:"🎏", d:"不利天气影响减半",   ef:"weatherResist", v:0.5},
    {id:"ancient_seed_bag", n:"远古种子袋", i:"🎒", d:"种子消耗-30%",       ef:"seedDiscount",  v:0.3},
    {id:"lucky_clover",     n:"四叶幸运草", i:"🍀", d:"杂交概率翻倍",       ef:"hybridChance",  v:2.0},
    {id:"merchant_contract",n:"远古商契",   i:"📜", d:"商人到访频率+50%",   ef:"merchantFreq",  v:0.5},
    {id:"time_hourglass",   n:"时之沙漏",   i:"⏳", d:"加工时间-40%",       ef:"processSpeed",  v:0.4}
]);
`

### data/research.js

`javascript
﻿// 研究项目定义
// cost: {resourceKey: amount} — 消耗资源
// unlocks: [{type, id}] — type: "upgrade"/"crop"/"research", id: 对应ID
//         [{type:"resource", k, q}] — 直接产出资源
// requires: [researchId] — 前置研究
// desc: 描述
DataRegistry.registerAll("research", [
    {id:"compost",      n:"谷物堆肥", i:"🌾♻️", desc:"消耗小麦制作堆肥，解锁堆肥升级",      cost:{wheat:1000},                    unlocks:[{type:"upgrade",id:"compostUpg"},{type:"story",id:"newcomer_1"}]},
    {id:"cropRotate",   n:"轮作制度", i:"🔄",   desc:"研究轮作提高产量，解锁轮作升级",      cost:{wheat:500, carrot:500},         unlocks:[{type:"upgrade",id:"cropRotateUpg"},{type:"story",id:"newcomer_2"}], requires:["compost"]},
    {id:"hybridAtlas",  n:"杂交图谱", i:"🧬",   desc:"绘制杂交图谱，提高杂交概率",          cost:{carrot:1000, pumpkin:500},      unlocks:[{type:"upgrade",id:"hybridAtlasUpg"}]},
    {id:"feedScience",  n:"饲料科学", i:"🐄🔬", desc:"研究动物饲料配方，提升好感度",        cost:{wheat:1500},                    unlocks:[{type:"upgrade",id:"feedScienceUpg"}], requires:["hybridAtlas"]},
    {id:"seedSelect",   n:"种子精选", i:"🌱✨", desc:"精选优质种子，获得一批种子储备",      cost:{wheat:300},                     unlocks:[{type:"resource",k:"seeds",q:30}]},
    {id:"deepPlow",     n:"深耕技术", i:"⛏️",   desc:"深耕土地提升产量，获得补偿种子",      cost:{potato:2000},                   unlocks:[{type:"upgrade",id:"deepPlowUpg"},{type:"resource",k:"seeds",q:50},{type:"story",id:"newcomer_3"}], requires:["cropRotate"]},
    {id:"ghOptimize",   n:"温室优化", i:"🏠⚡", desc:"优化温室效率，额外提升生长速度",      cost:{tomato:500, corn:500},          unlocks:[{type:"upgrade",id:"ghOptimizeUpg"},{type:"story",id:"newcomer_4"}], requires:["deepPlow"]},
    {id:"animalGene",   n:"动物基因", i:"🧪🐔", desc:"基因改良，动物产物+1",               cost:{egg:50},                        unlocks:[{type:"upgrade",id:"animalGeneUpg"}], requires:["feedScience"]},
    {id:"harvestTech",  n:"收获工艺", i:"🚜",   desc:"改进收获技术，所有作物收获量+1",      cost:{corn:1000, potato:500, wheat:500}, unlocks:[{type:"upgrade",id:"harvestTechUpg"},{type:"story",id:"newcomer_5"}], requires:["seedSelect"]},
    {id:"waterConserve",n:"节水灌溉", i:"💧",   desc:"研发节水灌溉，降低干旱影响",          cost:{corn:800, tomato:300},          unlocks:[{type:"upgrade",id:"waterConserveUpg"}], requires:["compost"]}
]);
`

### data/research_upgrades.js

`javascript
﻿// 研究解锁的升级定义
DataRegistry.registerAll("upgrade", [
    {id:"compostUpg",      n:"堆肥",       i:"🌾♻️", d:"生长加速20%",      c:1000,  unlock:0, ef:"grow", v:0.2,  reqResearch:"compost", reqUpgrade:"fertilizer"},
    {id:"cropRotateUpg",   n:"轮作增产",   i:"🔄",   d:"生长加速15%",      c:2000,  unlock:0, ef:"grow", v:0.15, reqResearch:"cropRotate", reqUpgrade:"megaFert"},
    {id:"hybridAtlasUpg",  n:"杂交图谱",   i:"🧬",   d:"杂交概率x1.5",     c:5000,  unlock:0, ef:"hybridChance", v:0.5, reqResearch:"hybridAtlas", reqUpgrade:"cropRotateUpg"},
    {id:"feedScienceUpg",  n:"饲料科学",   i:"🐄🔬", d:"动物好感+30%",     c:3000,  unlock:0, ef:"animalAff", v:0.3, reqResearch:"feedScience", reqUpgrade:"hybridAtlasUpg"},
    {id:"deepPlowUpg",     n:"深耕增产",   i:"⛏️",   d:"生长加速15%",      c:4000,  unlock:0, ef:"grow", v:0.15, reqResearch:"deepPlow", reqUpgrade:"compostUpg"},
    {id:"ghOptimizeUpg",   n:"温室优化",   i:"🏠⚡", d:"温室额外+10%生长", c:8000,  unlock:0, ef:"greenhouseBonus", v:0.1, reqResearch:"ghOptimize", reqUpgrade:"greenhouse"},
    {id:"animalGeneUpg",   n:"动物基因",   i:"🧪🐔", d:"动物产出+1",       c:10000, unlock:0, ef:"animalOutput", v:1, reqResearch:"animalGene", reqUpgrade:"feedScienceUpg"},
    {id:"harvestTechUpg",  n:"收获工艺",   i:"🚜",   d:"收获量+1",         c:15000, unlock:0, ef:"harvestPlus", v:1, reqResearch:"harvestTech", reqUpgrade:"drone"},
    {id:"waterConserveUpg",n:"节水灌溉",   i:"💧",   d:"暴风雨惩罚减半",   c:6000,  unlock:0, ef:"stormResist", v:0.5, reqResearch:"waterConserve", reqUpgrade:"irrigation"}
]);
`

### data/seasons.js

`javascript
// 季节定义
DataRegistry.registerAll("season", [
    {id:"spring", n:"春季", i:"🌸", order:0},
    {id:"summer", n:"夏季", i:"☀️", order:1},
    {id:"autumn", n:"秋季", i:"🍂", order:2},
    {id:"winter",  n:"冬季", i:"❄️", order:3}
]);
`

### data/soil.js

`javascript
// 土壤类型定义
DataRegistry.registerAll("soil", [
    {id:"normal", n:"普通土地"},
    {id:"clay",   n:"粘土地"},
    {id:"sand",   n:"沙地"},
    {id:"dark",   n:"黑土地"}
]);
`

### data/stories.js

`javascript
// 故事碎片定义
//对话中的引号请使用中文引号！！！否则载入不了！！！
DataRegistry.registerAll("story", [
    {id:"land_3",               t:"老农日记·其一", x:"今天在这片土地上挖出了一本破旧的日记。第一天，我种下了第一颗种子。土地虽然贫瘠，但我相信只要用心，它一定会回馈我。"},
    {id:"land_5",               t:"老农日记·其二", x:"又挖到一页日记。第三年，稻草人终于不够用了。我试着用木头做了个简单的灌溉装置，没想到效果出奇的好。"},
    {id:"animal_cow",           t:"老农日记·其三", x:"今天买了一头牛。它脾气倔得很，但产的奶是全镇最甜的。隔壁老王总想买走它，我才不卖。"},
    {id:"upgrade_greenhouse",   t:"老农日记·其四", x:"温室建好了！冬天也能种番茄了。孩子们说这是魔法，我说这是科学。不过有时候我也分不太清。"},
    {id:"hybrid_carrot_pumpkin",t:"老农日记·其五", x:"不可思议！胡萝卜和南瓜竟然杂交出了金色的新品种！我决定叫它金色胡萝卜。"},
    {id:"season_2_0",           t:"老农日记·其六", x:"又是一年春天。已经在这里种了十年地了。有人问我不无聊吗？我说，每天都能看到新芽破土，怎么可能会无聊。"},
    {id:"processor_mill",       t:"老农日记·其七", x:"磨坊建好的那天，全镇的人都来帮忙。小麦变成面粉，面粉变成面包。我突然明白，农业的意义不只是养活自己，更是把人们聚在一起。"},
    {id:"prestige_1",           t:"老农日记·其八", x:"翻开日记最后一页，上面只有一句话：如果有一天你读到这里，说明你已经继承了这片土地。好好待它，它会好好待你。"},
    {id:"land_8",               t:"老农日记·其九", x:"在第八块地的深处挖到了一个铁盒子。里面是一张泛黄的照片，老农和一头牛的合影，背面写着最好的伙伴。"},
    {id:"animal_sheep",         t:"老农日记·其十", x:"羊来了之后，农场热闹多了。它们总是咩咩叫，像是在抱怨伙食不好。好吧，我承认有时候会偷偷多喂它们一些。"},
    {id:"upgrade_drone",        t:"老农日记·其十一", x:"我要是活在今天，一定想都不敢想，无人机在田地上空盘旋，自己播种自己收割。这才是真正的魔法。"},
    {id:"hybrid_strawberry_grape",t:"老农日记·其十二", x:"草莓和葡萄杂交出的新品种美得像宝石。我把它叫做宝石莓。村里的小孩们抢着要吃。"},
    {id:"season_3_3",           t:"老农日记·其十三", x:"日记的最后一页夹着一片干枯的枫叶。又是一年深秋。树叶落了，庄稼收了。坐在田埂上，看着夕阳把农场染成金色。我想，这就是幸福吧。"},
    {id:"prestige_3",           t:"老农的遗嘱",       x:"在农场地下深处挖到了一个密封的罐子，里面是老农的遗嘱：我将这片土地和我毕生的经验，托付给每一个愿意在这里挥洒汗水的人。请不要辜负它。"},
    {id:"hybrid_tomato_pepper", t:"老农日记·其十四", x:"辣椒和番茄杂交出来的品种简直像地狱来的，又辣又甜。我决定叫它火焰番茄。吃一口能让你流汗，但第二口就停不下来。"},
    {id:"newcomer_1", t:"后来者日记·其一", x:"张博士来到了农场。他是镇上农业研究院的首席专家，戴着一副厚如瓶底的眼镜。我的研究方向是增产增效，他说，希望这片土地能给我们答案。"},
    {id:"newcomer_2", t:"后来者日记·其二", x:"经过一周的土壤采样，张博士发现这里的黑土层异常深厚。这是几万年前火山灰堆积形成的，他兴奋地在本子上记录，全国都找不到第二块这样的地。"},
    {id:"newcomer_3", t:"后来者日记·其三", x:"张博士的助手小李不小心打翻了一袋小麦，谷粒滚进了黏土山的试验田。一周后，那片地里长出了比正常高出一倍的麦穗。张博士陷入了沉思。"},
    {id:"newcomer_4", t:"后来者日记·其四", x:"研究团队申请到了一笔经费，在农场边上建了一个简易实验室。张博士说，这叫产学研结合。最好的实验室不是在大楼里，而是在泥土中。"},
    {id:"newcomer_5", t:"后来者日记·其五", x:"堆肥实验大获成功！张博士将小麦残渣和动物粪便按特定比例混合，发酵后施入田中。作物生长速度肉眼可见地加快了。这大概就是古人说的化作春泥更护花吧。"}
]);
`

### data/upgrades.js

`javascript
﻿// 农场升级定义
DataRegistry.registerAll("upgrade", [
    {id:"scarecrow",    n:"稻草人助手", i:"🤖", d:"自动播种",       c:300,   unlock:500,   ef:"autoPlant"},
    {id:"irrigation",   n:"灌溉系统",   i:"💧", d:"生长加速20%",    c:1500,  unlock:3000,  ef:"grow",     v:0.2},
    {id:"fertilizer",   n:"肥料研究",   i:"🧪", d:"生长加速30%",    c:5000,  unlock:10000, ef:"grow",     v:0.3},
    {id:"greenhouse",   n:"温室",       i:"🏠", d:"无视季节限制",   c:20000, unlock:50000, ef:"ignoreSeason", reqUpgrade:"sprinkler"},
    {id:"autoHarvest",  n:"自动收割机", i:"🚜", d:"自动收获",       c:15000, unlock:40000, ef:"autoHarvest", reqUpgrade:"scarecrow"},
    {id:"sprinkler",    n:"高级洒水器", i:"🚿", d:"生长加速50%",    c:30000, unlock:80000, ef:"grow",     v:0.5, reqUpgrade:"irrigation"},
    {id:"megaFert",     n:"超级肥料",   i:"⚗️", d:"生长加速100%",  c:100000, unlock:200000, ef:"grow",    v:1.0, reqUpgrade:"fertilizer"},
    {id:"drone",        n:"无人机群",   i:"🛸", d:"全自动管理",     c:50000, unlock:150000, ef:"fullAuto", reqUpgrade:"autoHarvest"}
]);
`

### data/weather.js

`javascript
// 天气定义
DataRegistry.registerAll("weather", [
    {id:"sunny",  n:"晴天",   i:"☀️", d:"生长加速+10%"},
    {id:"cloudy", n:"多云",   i:"☁️", d:"无加成"},
    {id:"rainy",  n:"雨天",   i:"🌧️", d:"生长加速+30%"},
    {id:"storm",  n:"暴风雨", i:"⛈️", d:"生长速度-40%"}
]);
`

---

## 5. Mod 清单模板（mods/manifest.js）

`javascript
window.__modManifest = window.__modManifest || [];
window.__modManifest.push({
    id: "your_mod_id",       // 英文下划线，全局唯一
    name: "你的模组名称",
    file: "your-mod.js",
    desc: "简短描述",
    version: "1.0"
});
`

## 6. 完整 Mod 示例

`javascript
// 注册新作物
DataRegistry.register("crop", {
    id: "pineapple",
    n: "菠萝",
    i: "🍍",
    g: 200,
    v: 90,
    harvestCount: 2,
    unlock: 80000
}, { modId: "my_mod" });

// 注册杂交品种
DataRegistry.register("hybrid", {
    id: "pineapple_watermelon",
    n: "黄金菠萝瓜",
    i: "✨🍍",
    p: ["pineapple", "watermelon"],
    ch: 0.08,
    g: 350,
    v: 250,
    harvestCount: 3,
    unlock: 300000
}, { modId: "my_mod" });

// 注册研究
DataRegistry.register("research", {
    id: "pineapple_study",
    n: "菠萝培育",
    i: "🍍🔬",
    desc: "研究菠萝的栽培技术，解锁菠萝增产升级",
    cost: { pineapple: 100, wheat: 500 },
    unlocks: [{ type: "upgrade", id: "pine_upgrade" }]
}, { modId: "my_mod" });

// 注册升级（被研究解锁）
DataRegistry.register("upgrade", {
    id: "pine_upgrade",
    n: "菠萝增产",
    i: "🍍📈",
    d: "菠萝生长加速30%",
    c: 5000,
    unlock: 0,
    ef: "grow",
    v: 0.3,
    reqResearch: "pineapple_study"
}, { modId: "my_mod" });
`

---

## 7. 核心规则

- **不要改引擎**：core/engine.js, core/engine-v2.js, index.html, patch.js
- **只通过 DataRegistry 注册**：不要直接修改全局 CROP_DEFS 等变量
- **数值平衡**：参考现有价格梯度，新内容生长时间和价值应合理
- **ID 唯一**：英文下划线，建议加前缀防冲突（如 mymod_crop1）
- **库存 key**：新作物/产物的 k 要全局唯一，不与现有冲突
- **ef 枚举**：只能使用上表列出的值
- **函数访问**：check/trigger/ef 函数可直接读写 GS（全局游戏状态）
- **modId**：注册时传入第三参数 { modId: "xxx" } 以支持玩家独立启用/禁用
