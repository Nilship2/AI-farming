// patch.js — 农场增量功能增强
// 通过包装原始函数注入，最小化对 game.js 的修改

(function() {

// ===== 1. initGame — 添加 scarecrowOn =====
var _initGame = initGame;
initGame = function() {
    _initGame();
    GS.scarecrowOn = true;
};

// ===== 2. loadGame — 迁移旧存档 =====
var _loadGame = loadGame;
loadGame = function() {
    var result = _loadGame();
    if (typeof GS.scarecrowOn === "undefined") {
        GS.scarecrowOn = true;
    }
    return result;
};

// ===== 3. doHarvest — 记录 lastCrop =====
var _doHarvest = doHarvest;
doHarvest = function(s) {
    if (s && s.crop) {
        s.lastCrop = s.crop.id;
    }
    return _doHarvest(s);
};

// ===== 4. renderProc — 加工按钮原料不足时禁用 =====
var _renderProc = renderProc;
renderProc = function() {
    _renderProc();
    var pp = document.getElementById("pp");
    if (!pp) return;
    var buttons = pp.querySelectorAll('[data-action="startProc"]');
    for (var i = 0; i < buttons.length; i++) {
        var btn = buttons[i];
        var pid = btn.getAttribute("data-pid");
        if (!pid) continue;
        var d = PROC_DEFS[pid];
        if (!d) continue;
        var hasIngredient = GS.inventory[d.inp.k] && GS.inventory[d.inp.k] > 0;
        if (!hasIngredient) {
            btn.disabled = true;
            btn.style.opacity = "0.35";
            btn.style.cursor = "not-allowed";
            btn.textContent = "\u9700\u8981" + d.inp.n;
        } else {
            btn.disabled = false;
            btn.style.opacity = "";
            btn.style.cursor = "";
            btn.textContent = "\u52a0\u5de5 (" + d.inp.n + "x1)";
        }
    }
};

// ===== 5. R() — 显示/隐藏稻草人开关 =====
var _R = R;
R = function() {
    _R();
    var st = document.getElementById("scarecrowToggle");
    if (st) {
        st.style.display = (GS.upgrades.scarecrow || GS.upgrades.drone) ? "block" : "none";
    }
    var sb = document.getElementById("btnScarecrow");
    if (sb) {
        var on = GS.scarecrowOn !== false;
        sb.textContent = "\u{1f916} \u7a3b\u8349\u4eba: " + (on ? "\u5f00" : "\u5173");
        sb.className = "bt sm" + (on ? " gn" : " rd");
    }
};

// ===== 6. toggleScarecrow 全局函数 =====
window.toggleScarecrow = function() {
    GS.scarecrowOn = !GS.scarecrowOn;
    R();
    notify(GS.scarecrowOn !== false ? "\u7a3b\u8349\u4eba\u5df2\u5f00\u542f" : "\u7a3b\u8349\u4eba\u5df2\u5173\u95ed");
};

})();
