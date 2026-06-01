// ============================================================
// 存档槽位系统 v2 — 5 个存档位，各自绑定 Mod 清单
// ============================================================
(function() {
    window.__saveSlot = 0;
    try {
        var s = parseInt(localStorage.getItem("farm_current_slot") || "0");
        if (!isNaN(s) && s >= 0 && s <= 4) window.__saveSlot = s;
    } catch(e) {}

    var _ready = false;
    function init() {
        if (_ready) return;
        if (typeof saveGame !== "function" || typeof loadGame !== "function") {
            setTimeout(init, 50);
            return;
        }
        _ready = true;

        // === 包装 saveGame ===
        var _saveGame = saveGame;
        saveGame = function() {
            GS._mods = (window.__enabledMods || []).slice();
            _saveGame();
            try {
                localStorage.setItem("farm_save_slot_" + window.__saveSlot, JSON.stringify(GS));
            } catch(e) {}
        };

        // === 包装 loadGame ===
        var _loadGame = loadGame;
        loadGame = function() {
            var slotKey = "farm_save_slot_" + window.__saveSlot;
            var backup = null;
            try { backup = localStorage.getItem("farm_save"); } catch(e) {}

            var slotSave = null;
            try { slotSave = localStorage.getItem(slotKey); } catch(e) {}

            if (slotSave) {
                // 有槽位存档 → 复制到 farm_save 供原版读取
                try { localStorage.setItem("farm_save", slotSave); } catch(e) {}
            } else {
                // 空槽位 → 清掉 farm_save，避免继承旧档
                try { localStorage.removeItem("farm_save"); } catch(e) {}
            }

            var result = _loadGame();

            // 恢复原 farm_save
            try {
                if (backup !== null) localStorage.setItem("farm_save", backup);
                else localStorage.removeItem("farm_save");
            } catch(e) {}

            return result;
        };

        // === 新存档后立刻保存（修复#5） ===
        var _initGame = initGame;
        initGame = function() {
            _initGame();
            GS._mods = (window.__enabledMods || []).slice();
            // 延迟保存确保 GS 完全初始化
            setTimeout(function() {
                try {
                    localStorage.setItem("farm_save_slot_" + window.__saveSlot, JSON.stringify(GS));
                } catch(e) {}
            }, 500);
        };

        console.log("[SaveSlots] 槽位 " + window.__saveSlot + " 已激活");
    }
    init();

    // === 切换槽位 ===
    window.switchSaveSlot = function(newSlot) {
        if (newSlot < 0 || newSlot > 4) return;
        if (typeof saveGame === "function") saveGame();
        localStorage.setItem("farm_current_slot", String(newSlot));
        location.reload();
    };

    window.getSaveSlotInfo = function(slotIdx) {
        var key = "farm_save_slot_" + slotIdx;
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return null;
            var data = JSON.parse(raw);
            return {
                coins: data.coins || 0,
                year: data.year || 1,
                season: (data.season !== undefined ? data.season : 0),
                prestige: data.prestigePoints || 0,
                mods: data._mods || [],
                modCount: (data._mods || []).length,
                lastSave: data.lastSave || 0
            };
        } catch(e) { return null; }
    };

    window.deleteSaveSlot = function(slotIdx) {
        localStorage.removeItem("farm_save_slot_" + slotIdx);
        if (window.__saveSlot === slotIdx) {
            localStorage.removeItem("farm_current_slot");
            location.reload();
        } else {
            location.reload();
        }
    };
})();
