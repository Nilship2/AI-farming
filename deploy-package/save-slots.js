// ============================================================
// 存档槽位系统 v3 — 强制重置 + 即时持久化
// ============================================================
(function() {
    window.__saveSlot = 0;
    try {
        var s = parseInt(localStorage.getItem("farm_current_slot") || "0");
        if (!isNaN(s) && s >= 0 && s <= 4) window.__saveSlot = s;
    } catch(e) {}

    function resetGS() {
        GS.coins = 0; GS.gems = 0; GS.totalCoinsEarned = 0;
        GS.totalCropsHarvested = 0; GS.totalAnimalsRaised = 0;
        GS.prestigePoints = 0; GS.totalGemsEarned = 0;
        GS.inventory = { seeds: 10 };
        GS.discoveredCrops = ["wheat"]; GS.discoveredAnimals = [];
        GS.discoveredHybrids = []; GS.relics = []; GS.storyFragments = [];
        GS.achievements = {}; GS.gemUpgrades = {}; GS.year = 1;
        GS.season = 0; GS.seasonTimer = 0; GS.land = [];
        GS.animals = []; GS.upgrades = {}; GS.processors = {};
        GS.merchantOffers = []; GS._planting = -1;
        GS.weather = "sunny"; GS.weatherTimer = 0;
    }

    var _ready = false;
    function init() {
        if (_ready) return;
        if (typeof saveGame !== "function" || typeof loadGame !== "function") {
            setTimeout(init, 50); return;
        }
        _ready = true;

        var _saveGame = saveGame;
        saveGame = function() {
            GS._mods = (window.__enabledMods || []).slice();
            _saveGame();
            try { localStorage.setItem("farm_save_slot_" + window.__saveSlot, JSON.stringify(GS)); } catch(e) {}
        };

        var _loadGame = loadGame;
        loadGame = function() {
            var slotKey = "farm_save_slot_" + window.__saveSlot;
            var backup = null;
            try { backup = localStorage.getItem("farm_save"); } catch(e) {}
            var slotSave = null;
            try { slotSave = localStorage.getItem(slotKey); } catch(e) {}

            if (slotSave) {
                try { localStorage.setItem("farm_save", slotSave); } catch(e) {}
            } else {
                resetGS(); // ★ 强制清空 GS 旧值
                try { localStorage.removeItem("farm_save"); } catch(e) {}
            }

            var result = _loadGame();

            try {
                if (backup !== null) localStorage.setItem("farm_save", backup);
                else localStorage.removeItem("farm_save");
            } catch(e) {}
            return result;
        };

        // ★ initGame 后立即保存
        var _initGame = initGame;
        initGame = function() {
            _initGame();
            GS._mods = (window.__enabledMods || []).slice();
            if (typeof saveGame === "function") saveGame();
        };

        console.log("[SaveSlots] 槽位 " + window.__saveSlot + " 已激活");
        // ★ 包装完成，启动游戏
        if (typeof rebuildBridge === "function") rebuildBridge();
        if (typeof startGame === "function") {
            window.__modSelectionPending = false;
            startGame();
        }
    }
    init();

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
        }
        location.reload();
    };
})();
