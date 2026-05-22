// patch.js — 农场增量功能增强 v2
(function() {

// ===================================================================
// 1. initGame — 添加 scarecrowOn
// ===================================================================
var _initGame = initGame;
initGame = function() {
    _initGame();
    GS.scarecrowOn = true;
};

// ===================================================================
// 2. loadGame — 迁移旧存档
// ===================================================================
var _loadGame = loadGame;
loadGame = function() {
    var result = _loadGame();
    if (typeof GS.scarecrowOn === "undefined") GS.scarecrowOn = true;
    return result;
};

// ===================================================================
// 3. doHarvest — 记录 lastCrop
// ===================================================================
var _doHarvest = doHarvest;
doHarvest = function(s) {
    if (s && s.crop) s.lastCrop = s.crop.id;
    GS._invNotified = false; return _doHarvest(s);
};

// ===================================================================
// 4. renderProc — 加工按钮原料不足时灰色显示 (不用 disabled，保留可点击)
// ===================================================================
var _renderProc = renderProc;
renderProc = function() {
    _renderProc();
    var pp2 = document.getElementById("pp");
    if (!pp2) return;

    // 1. Add unlock/cost info to locked cards
    var cards = pp2.getElementsByClassName("sl");
    for (var ci = 0; ci < cards.length; ci++) {
        var card = cards[ci];
        if (card.getAttribute("data-pid-inited")) continue;
        card.setAttribute("data-pid-inited", "1");
        var nameEl = card.querySelector("div:nth-child(2)");
        if (!nameEl) continue;
        var cardName = nameEl.textContent.trim();
        for (var pk in PROC_DEFS) {
            if (cardName.indexOf(PROC_DEFS[pk].n) === 0) {
                var d = PROC_DEFS[pk];
                if (card.classList.contains("lk")) {
                    var need = Math.max(0, d.unlock - Math.floor(GS.totalCoinsEarned));
                    var infoEl = document.createElement("div");
                    infoEl.className = "tt";
                    infoEl.style.cssText = "margin-top:4px;color:" + (need > 0 ? "#ff9800" : "#66bb6a");
                    infoEl.textContent = need > 0 ? ("需累计" + d.unlock + "💰 (还差" + need + ")") : "已可建造！建造费" + d.c + "💰";
                    card.appendChild(infoEl);
                }
                break;
            }
        }
    }

    // 2. Show debug notification when panel is active
    if ((" " + pp2.className + " ").indexOf(" ac ") !== -1 && !GS._invNotified) {
        GS._invNotified = true;
        var info = [];
        for (var k2 in PROC_DEFS) {
            var d2 = PROC_DEFS[k2];
            var amt = GS.inventory[d2.inp.k] || 0;
            var pr2 = GS.processors[k2];
            if (pr2 && pr2.owned) {
                info.push(d2.n + ":" + d2.inp.n + "=" + amt);
            } else if (GS.totalCoinsEarned >= d2.unlock) {
                info.push(d2.n + ":(可建造)");
            }
        }
        notify("加工: " + (info.length > 0 ? info.join(", ") : "无已解锁设施。累计金币:" + Math.floor(GS.totalCoinsEarned)));
    }
};// ===================================================================
// 5. R() — 显示/隐藏稻草人开关 + 存档按钮状态
// ===================================================================
var _R = R;
R = function() {
    _R();
    var st = document.getElementById("scarecrowToggle");
    if (st) st.style.display = (GS.upgrades.scarecrow || GS.upgrades.drone) ? "inline-block" : "none";
    var sb = document.getElementById("btnScarecrow");
    if (sb) {
        var on = GS.scarecrowOn !== false;
        sb.textContent = "\u{1f916} \u7a3b\u8349\u4eba: " + (on ? "\u5f00" : "\u5173");
        sb.className = "bt sm" + (on ? " gn" : " rd");
    }
};

// ===================================================================
// 6. toggleScarecrow
// ===================================================================
window.toggleScarecrow = function() {
    GS.scarecrowOn = !GS.scarecrowOn;
    R();
    notify(GS.scarecrowOn !== false ? "\u7a3b\u8349\u4eba\u5df2\u5f00\u542f" : "\u7a3b\u8349\u4eba\u5df2\u5173\u95ed");
};

// ===================================================================
// 7. 手动保存 — saveGame 包装 + 按钮
// ===================================================================
var _saveGame = saveGame;
saveGame = function() {
    _saveGame();
    var btn = document.getElementById("btnSave");
    if (btn) {
        btn.textContent = "\u2705 \u5df2\u4fdd\u5b58";
        btn.className = "bt sm gn";
        setTimeout(function() {
            if (btn) { btn.textContent = "\u{1f4be} \u4fdd\u5b58"; btn.className = "bt sm"; }
        }, 1500);
    }
};
window.manualSave = function() {
    saveGame();
    notify("\u{1f4be} \u6e38\u620f\u5df2\u4fdd\u5b58\uff01");
};

// ===================================================================
// 8. 图鉴详情弹窗
// ===================================================================
window.showDetail = function(type, id) {
    var overlay = document.getElementById("detailOverlay");
    var content = document.getElementById("detailContent");
    if (!overlay || !content) return;

    var h = "";
    if (type === "crop") {
        var cd = CROP_DEFS[id];
        if (!cd) return;
        var discovered = GS.discoveredCrops.indexOf(id) !== -1;
        var totalHarvested = GS.inventory[id] || 0;
        h += '<div style="font-size:3em">' + (cd.i || "\u{1f331}") + '</div>';
        h += '<h2 style="color:#ffd700;margin:8px 0">' + cd.n + '</h2>';
        h += '<div class="tt" style="font-size:.9em">' + (discovered ? "\u2705 \u5df2\u53d1\u73b0" : "\u{1f512} \u672a\u53d1\u73b0") + '</div>';
        h += '<div style="margin-top:12px;line-height:1.8;font-size:.9em">';
        h += '<div>\u{1f4b0} \u6536\u83b7\u4ef7\u503c: <strong>' + cd.v + '\u91d1\u5e01</strong></div>';
        h += '<div>\u23f1 \u751f\u957f\u65f6\u95f4: <strong>' + cd.g + '\u79d2</strong></div>';
        if (cd.soil) h += '<div>\u{1f3f7} \u6700\u4f73\u571f\u58e4: <strong>' + cd.soil + '</strong>\uff08\u751f\u957f\u901f\u5ea6+50%\uff09</div>';
        else h += '<div>\u{1f3f7} \u571f\u58e4: \u65e0\u7279\u6b8a\u8981\u6c42</div>';
        h += '<div>\u{1f4e6} \u5e93\u5b58: <strong>' + totalHarvested + ' \u4e2a</strong></div>';
        h += '<div>\u{1f4b0} \u89e3\u9501\u9700\u8981\u7d2f\u8ba1: <strong>' + cd.unlock + '\u91d1\u5e01</strong></div>';
        h += '<div>\u{1f331} \u79cd\u690d\u6210\u672c: \u7ea6 <strong>' + Math.ceil(cd.v * 0.25) + '</strong> \u79cd\u5b50</div>';
        h += '<div>\u2728 \u6536\u83b7\u65f6: \u83b7\u5f97\u91d1\u5e01 + \u6536\u85cf\u4f5c\u7269\uff0c30%\u6982\u7387\u8fd4\u8fd8\u79cd\u5b50</div>';
        h += '</div>';
    } else if (type === "animal") {
        var ad = ANIMAL_DEFS[id];
        if (!ad) return;
        var discovered = GS.discoveredAnimals.indexOf(id) !== -1;
        var owned = 0;
        for (var ai = 0; ai < GS.animals.length; ai++) { if (GS.animals[ai].id === id) owned++; }
        h += '<div style="font-size:3em">' + ad.i + '</div>';
        h += '<h2 style="color:#ffd700;margin:8px 0">' + ad.n + '</h2>';
        h += '<div class="tt" style="font-size:.9em">' + (discovered ? "\u2705 \u5df2\u53d1\u73b0" : "\u{1f512} \u672a\u53d1\u73b0") + '</div>';
        h += '<div style="margin-top:12px;line-height:1.8;font-size:.9em">';
        h += '<div>\u{1f4b0} \u8d2d\u4e70\u4ef7\u683c: <strong>' + ad.c + '\u91d1\u5e01</strong></div>';
        h += '<div>\u{1f4e6} \u4ea7\u7269: <strong>' + ad.p.i + ad.p.n + '</strong> (\u4ef7\u503c' + ad.p.v + '\u91d1\u5e01)</div>';
        h += '<div>\u23f1 \u4ea7\u51fa\u95f4\u9694: <strong>' + ad.p.t + '\u79d2</strong></div>';
        h += '<div>\u{1f49d} \u6ee1\u597d\u611f: <strong>' + ad.am + '</strong> (\u4ea7\u51fa\u7ffb\u500d)</div>';
        h += '<div>\u{1f4b0} \u89e3\u9501\u9700\u8981\u7d2f\u8ba1: <strong>' + ad.unlock + '\u91d1\u5e01</strong></div>';
        h += '<div>\u{1f43e} \u62e5\u6709: <strong>' + owned + ' \u53ea</strong></div>';
        h += '</div>';
    } else if (type === "hybrid") {
        var hd = HYBRID_DEFS[id];
        if (!hd) return;
        var hydiscovered = GS.discoveredHybrids.indexOf(id) !== -1;
        h += '<div style="font-size:3em">' + (hd.i || "\u2728") + '</div>';
        h += '<h2 style="color:#ffd700;margin:8px 0">' + hd.n + '</h2>';
        h += '<div class="tt" style="font-size:.9em">' + (hydiscovered ? "\u2705 \u5df2\u57f9\u80b2" : "\u{1f512} \u672a\u57f9\u80b2") + '</div>';
        h += '<div style="margin-top:12px;line-height:1.8;font-size:.9em">';
        h += '<div>\u{1f4b0} \u4ef7\u503c: <strong>' + hd.v + '\u91d1\u5e01</strong></div>';
        h += '<div>\u{1f9ec} \u6742\u4ea4\u6982\u7387: <strong>' + Math.floor(hd.ch * 100) + '%</strong></div>';
        h += '<div>\u{1f331} \u9700\u8981\u76f8\u90bb\u79cd\u690d: <strong>' + (CROP_DEFS[hd.p[0]] ? CROP_DEFS[hd.p[0]].n : hd.p[0]) + ' + ' + (CROP_DEFS[hd.p[1]] ? CROP_DEFS[hd.p[1]].n : hd.p[1]) + '</strong></div>';
        h += '<div>\u{1f4b0} \u89e3\u9501\u9700\u8981\u7d2f\u8ba1: <strong>' + hd.unlock + '\u91d1\u5e01</strong></div>';
        h += '</div>';
    }

    content.innerHTML = h;
    overlay.style.display = "flex";
};

window.closeDetail = function() {
    var overlay = document.getElementById("detailOverlay");
    if (overlay) overlay.style.display = "none";
};

// ===================================================================
// 9. renderBestiary — 图鉴增加点击详情
// ===================================================================
var _renderBestiary = renderBestiary;
renderBestiary = function() {
    _renderBestiary();
    var pb = document.getElementById("pb");
    if (!pb) return;
    // Add click handlers to crop cards
    var cards = pb.querySelectorAll(".sl");
    for (var i = 0; i < cards.length; i++) {
        (function(card) {
            card.style.cursor = "pointer";
            card.addEventListener("click", function(e) {
                // Determine type from context
                var cropIcon = card.querySelector('[style*="font-size:2em"]');
                if (!cropIcon) return;
                // Try to find the crop id by matching the icon
                for (var ck in CROP_DEFS) {
                    if (CROP_DEFS[ck].i === cropIcon.textContent.trim()) {
                        showDetail("crop", ck);
                        return;
                    }
                }
                for (var ak in ANIMAL_DEFS) {
                    if (ANIMAL_DEFS[ak].i === cropIcon.textContent.trim()) {
                        showDetail("animal", ak);
                        return;
                    }
                }
                for (var hk in HYBRID_DEFS) {
                    if (HYBRID_DEFS[hk].i === cropIcon.textContent.trim()) {
                        showDetail("hybrid", hk);
                        return;
                    }
                }
            });
        })(cards[i]);
    }
};

// ===================================================================
// 10. renderFarm 后处理 — 铲除作物按钮
// ===================================================================
var _renderFarm = renderFarm;
renderFarm = function() {
    _renderFarm();
    if (GS._planting >= 0) return;
    var pf = document.getElementById("pf");
    if (!pf) return;
    var slots = pf.querySelectorAll(".sl[data-action='growing']");
    for (var i = 0; i < slots.length; i++) {
        (function(slot, sidStr) {
            if (slot.querySelector(".rmBtn")) return;
            var sidNum = parseInt(sidStr);
            var rmBtn = document.createElement("button");
            rmBtn.className = "bt sm rd rmBtn";
            rmBtn.style.cssText = "margin-top:4px;font-size:.65em;padding:2px 6px";
            rmBtn.textContent = "\u{1f5d1} \u94f2\u9664";
            rmBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                var s = GS.land[sidNum];
                if (!s || !s.crop) return;
                var cd = CROP_DEFS[s.crop.id];
                var refund = Math.ceil(cd.v * 0.25);
                GS.inventory.seeds = (GS.inventory.seeds || 0) + refund;
                s.crop = null;
                notify("\u{1f5d1} \u5df2\u94f2\u9664\uff0c\u8fd4\u8fd8 " + refund + " \u79cd\u5b50");
                renderFarm();
                R();
            });
            slot.appendChild(rmBtn);
        })(slots[i], slots[i].getAttribute("data-sid"));
    }
};

// ===================================================================
// 11. startProc 包装 — 更好的错误提示
// ===================================================================
var _startProc = startProc;
startProc = function(k) {
    var pr = GS.processors[k];
    if (!pr || !pr.owned) { notify("\u8bf7\u5148\u5efa\u9020\u8bbe\u65bd\uff01\u8bbe\u65bd\u9700\u8981\u8d2d\u4e70\u3002"); return; }
    if (pr.busy) { notify("\u8bbe\u65fd\u52a0\u5de5\u4e2d..."); return; }
    var d = PROC_DEFS[k];
    if (!d) { notify("\u52a0\u5de5\u5b9a\u4e49\u672a\u627e\u5230: " + k); return; }
    var invAmt = GS.inventory[d.inp.k] || 0;
    if (invAmt <= 0) {
        notify(d.inp.n + "\u4e0d\u8db3\uff01\u5f53\u524d\u5e93\u5b58: " + invAmt + "\u3002\u8bf7\u5148\u6536\u83b7\u4f5c\u7269\u3002");
        return;
    }
    notify("\u5f00\u59cb\u52a0\u5de5: " + d.n + "\uff0c\u6d88\u8017 " + d.inp.n + " x1");
    GS._invNotified = false; return _startProc(k);
};})();
