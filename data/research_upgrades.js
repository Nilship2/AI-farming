// 研究解锁的升级定义
DataRegistry.registerAll("upgrade", [
    {id:"compostUpg",      n:"堆肥",       i:"🌾♻️", d:"生长加速20%",      c:1000,  unlock:0, ef:"grow", v:0.2,  reqResearch:"compost"},
    {id:"cropRotateUpg",   n:"轮作增产",   i:"🔄",   d:"生长加速15%",      c:2000,  unlock:0, ef:"grow", v:0.15, reqResearch:"cropRotate"},
    {id:"hybridAtlasUpg",  n:"杂交图谱",   i:"🧬",   d:"杂交概率x1.5",     c:5000,  unlock:0, ef:"hybridChance", v:0.5, reqResearch:"hybridAtlas"},
    {id:"feedScienceUpg",  n:"饲料科学",   i:"🐄🔬", d:"动物好感+30%",     c:3000,  unlock:0, ef:"animalAff", v:0.3, reqResearch:"feedScience"},
    {id:"deepPlowUpg",     n:"深耕增产",   i:"⛏️",   d:"生长加速15%",      c:4000,  unlock:0, ef:"grow", v:0.15, reqResearch:"deepPlow"},
    {id:"ghOptimizeUpg",   n:"温室优化",   i:"🏠⚡", d:"温室额外+10%生长", c:8000,  unlock:0, ef:"greenhouseBonus", v:0.1, reqResearch:"ghOptimize"},
    {id:"animalGeneUpg",   n:"动物基因",   i:"🧪🐔", d:"动物产出+1",       c:10000, unlock:0, ef:"animalOutput", v:1, reqResearch:"animalGene"},
    {id:"harvestTechUpg",  n:"收获工艺",   i:"🚜",   d:"收获量+1",         c:15000, unlock:0, ef:"harvestPlus", v:1, reqResearch:"harvestTech"},
    {id:"waterConserveUpg",n:"节水灌溉",   i:"💧",   d:"暴风雨惩罚减半",   c:6000,  unlock:0, ef:"stormResist", v:0.5, reqResearch:"waterConserve"}
]);
