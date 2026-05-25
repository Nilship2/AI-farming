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