// ============================================================
// Mod 加载器 v2 — 简化版
// community-mod-loader 已根据存档设置 __enabledMods
// 此处仅做兜底 + 启动游戏
// ============================================================
(function() {
    var manifest = window.__modManifest || [];
    var savedMods = null;
    
    // 尝试从存档读取（兼容旧存档）
    try {
        var raw = localStorage.getItem("farm_save_slot_0");
        if (!raw) raw = localStorage.getItem("farm_save"); // 兼容旧 key
        if (raw) {
            var save = JSON.parse(raw);
            savedMods = save._enabledMods || save._mods || null;
        }
    } catch(e) { savedMods = null; }
    
    // 如果 community-mod-loader 还没设置，用存档中的
    if (!window.__enabledMods || window.__enabledMods.length === 0) {
        if (savedMods && savedMods.length > 0) {
            // 验证 Mod 都存在
            var valid = [];
            for (var i = 0; i < savedMods.length; i++) {
                var found = false;
                for (var j = 0; j < manifest.length; j++) {
                    if (manifest[j].id === savedMods[i]) { found = true; break; }
                }
                if (found) valid.push(savedMods[i]);
            }
            DataRegistry.setEnabledMods(valid);
            window.__enabledMods = valid;
        } else {
            DataRegistry.setEnabledMods([]);
            window.__enabledMods = [];
        }
    }
    
    // 确保桥接重建
    if (typeof rebuildBridge === "function") rebuildBridge();
    
    // 直接启动（不再显示 Mod 选择 UI）
    window.__modSelectionPending = false;
    if (typeof startGame === "function") startGame();
})();
