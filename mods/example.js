// ============================================================
// Mod 示例：奇幻作物包
// 使用方法：在 index.html 中加载此文件即可
//   <script src="mods/example.js"></script>
// ============================================================

// 1. 添加新作物
DataRegistry.register("crop", {
    id: "magic_mushroom",
    n: "魔法蘑菇",
    i: "🍄✨",
    g: 400,
    v: 300,
    soil: "dark",
    unlock: 500000
});

// 2. 添加新杂交品种
DataRegistry.register("hybrid", {
    id: "magic_pumpkin",
    n: "魔法南瓜",
    i: "✨🎃",
    p: ["magic_mushroom", "pumpkin"],
    ch: 0.05,
    v: 500,
    g: 500,
    soil: "dark",
    unlock: 800000
});

// 3. 覆盖现有定义（如调整数值）
// DataRegistry.override("crop", {
//     id: "wheat",
//     n: "超级小麦",
//     i: "🌾⚡",
//     g: 40,
//     v: 20,
//     soil: null,
//     unlock: 0
// });

// 4. 添加新成就
DataRegistry.register("achievement", {
    id: "magic_harvest",
    n: "魔法农夫",
    d: "收获魔法蘑菇",
    t: 5,
    ch: function() {
        return (GS.inventory["magic_mushroom"] || 0) >= 1;
    }
});

console.log("[奇幻作物包] Mod 已加载！新增作物：魔法蘑菇、魔法南瓜");