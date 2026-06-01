// ============================================================
// Mod 加载器 v3 — 仅设置 Mod，不启动游戏
// save-slots.js 负责在所有包装器就绪后启动
// ============================================================
(function() {
    var manifest = window.__modManifest || [];
    
    // 如果 community-mod-loader 已设置，沿用
    if (window.__enabledMods && window.__enabledMods.length > 0) {
        DataRegistry.setEnabledMods(window.__enabledMods);
    } else {
        // 兼容旧存档
        var savedMods = null;
        try {
            var raw = localStorage.getItem("farm_save_slot_0");
            if (!raw) raw = localStorage.getItem("farm_save");
            if (raw) {
                var save = JSON.parse(raw);
                savedMods = save._enabledMods || save._mods || null;
            }
        } catch(e) {}
        
        if (savedMods && savedMods.length > 0) {
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
    
    if (typeof rebuildBridge === "function") rebuildBridge();
    
    // 不在这里启动游戏 — save-slots.js 会在包装完成后启动
})();
