// ============================================================
// 存档槽位系统 — 5 个存档位，各自绑定 Mod 清单
// 在 engine-v2.js 之后加载
// ============================================================
(function() {
    // 读取当前槽位
    window.__saveSlot = 0;
    try {
        var s = parseInt(localStorage.getItem("farm_current_slot") || "0");
        if (!isNaN(s) && s >= 0 && s <= 4) window.__saveSlot = s;
    } catch(e) {}

    // 等 saveGame/loadGame 就绪后包装
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
            // 写入 _mods
            GS._mods = (window.__enabledMods || []).slice();
            // 调用原版
            _saveGame();
            // 额外保存到槽位 key
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

            // 把槽位存档复制到 farm_save（原版 loadGame 读这个 key）
            var slotSave = null;
            try { slotSave = localStorage.getItem(slotKey); } catch(e) {}
            if (slotSave) {
                try { localStorage.setItem("farm_save", slotSave); } catch(e) {}
            }

            var result = _loadGame();

            // 恢复原 farm_save
            try {
                if (backup !== null) localStorage.setItem("farm_save", backup);
                else localStorage.removeItem("farm_save");
            } catch(e) {}

            return result;
        };

        console.log("[SaveSlots] 槽位 " + window.__saveSlot + " 已激活");
    }
    init();

    // === 切换槽位（供外部调用） ===
    window.switchSaveSlot = function(newSlot) {
        if (newSlot < 0 || newSlot > 4) return;
        if (typeof saveGame === "function") saveGame(); // 保存当前进度
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
        }
    };
})();
