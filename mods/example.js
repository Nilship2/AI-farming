// 奇幻作物包 — 始终注册，由 DataRegistry 根据启用状态过滤
DataRegistry.register("crop", {
    id: "magic_mushroom", n: "魔法蘑菇", i: "🍉✨",
    g: 400, v: 300, specialSoils: [{soil:"dark",mult:1.8}], specialSeasons: [],
    harvestCount: 2, unlock: 500000
}, {modId: "example"});

DataRegistry.register("hybrid", {
    id: "magic_pumpkin", n: "魔法南瓜", i: "✨🎃",
    p: ["magic_mushroom", "pumpkin"], ch: 0.05,
    v: 500, g: 500, specialSoils: [{soil:"dark",mult:1.8}], specialSeasons: [],
    harvestCount: 2, unlock: 800000
}, {modId: "example"});

DataRegistry.register("achievement", {
    id: "magic_harvest", n: "魔法农夫", d: "收获魔法蘑菇", t: 5,
    ch: function() { return (GS.inventory["magic_mushroom"] || 0) >= 1; }
}, {modId: "example"});
