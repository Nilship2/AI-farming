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
    {id:"expandLand",    n:"拓展疆土",   i:"🏞️", d:"+1土地",       c:5,  ef:"land",          repeatable:true, costGrowth:3}
]);