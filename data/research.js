// 研究项目定义
// cost: {resourceKey: amount} — 消耗资源
// unlocks: [{type, id}] — type: "upgrade"/"crop"/"research", id: 对应ID
//         [{type:"resource", k, q}] — 直接产出资源
// requires: [researchId] — 前置研究
// desc: 描述
DataRegistry.registerAll("research", [
    {id:"compost",      n:"谷物堆肥", i:"🌾♻️", desc:"消耗小麦制作堆肥，解锁堆肥升级",      cost:{wheat:1000},                    unlocks:[{type:"upgrade",id:"compostUpg"},{type:"story",id:"newcomer_1"}]},
    {id:"cropRotate",   n:"轮作制度", i:"🔄",   desc:"研究轮作提高产量，解锁轮作升级",      cost:{wheat:500, carrot:500},         unlocks:[{type:"upgrade",id:"cropRotateUpg"},{type:"story",id:"newcomer_2"}], requires:["compost"]},
    {id:"hybridAtlas",  n:"杂交图谱", i:"🧬",   desc:"绘制杂交图谱，提高杂交概率",          cost:{carrot:1000, pumpkin:500},      unlocks:[{type:"upgrade",id:"hybridAtlasUpg"}]},
    {id:"feedScience",  n:"饲料科学", i:"🐄🔬", desc:"研究动物饲料配方，提升好感度",        cost:{wheat:1500},                    unlocks:[{type:"upgrade",id:"feedScienceUpg"}]},
    {id:"seedSelect",   n:"种子精选", i:"🌱✨", desc:"精选优质种子，获得一批种子储备",      cost:{wheat:300},                     unlocks:[{type:"resource",k:"seeds",q:30}]},
    {id:"deepPlow",     n:"深耕技术", i:"⛏️",   desc:"深耕土地提升产量，获得补偿种子",      cost:{potato:2000},                   unlocks:[{type:"upgrade",id:"deepPlowUpg"},{type:"resource",k:"seeds",q:50},{type:"story",id:"newcomer_3"}]},
    {id:"ghOptimize",   n:"温室优化", i:"🏠⚡", desc:"优化温室效率，额外提升生长速度",      cost:{tomato:500, corn:500},          unlocks:[{type:"upgrade",id:"ghOptimizeUpg"},{type:"story",id:"newcomer_4"}], requires:["deepPlow"]},
    {id:"animalGene",   n:"动物基因", i:"🧪🐔", desc:"基因改良，动物产物+1",               cost:{egg:50},                        unlocks:[{type:"upgrade",id:"animalGeneUpg"}], requires:["feedScience"]},
    {id:"harvestTech",  n:"收获工艺", i:"🚜",   desc:"改进收获技术，所有作物收获量+1",      cost:{corn:1000, potato:500, wheat:500}, unlocks:[{type:"upgrade",id:"harvestTechUpg"},{type:"story",id:"newcomer_5"}]},
    {id:"waterConserve",n:"节水灌溉", i:"💧",   desc:"研发节水灌溉，降低干旱影响",          cost:{corn:800, tomato:300},          unlocks:[{type:"upgrade",id:"waterConserveUpg"}], requires:["cropRotate"]}
]);
