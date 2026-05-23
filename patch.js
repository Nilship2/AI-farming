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
    if (typeof GS.scarecrowOn === "undefined") GS.scarecrowOn = true; GS.maxLand = 20 + Math.floor((GS.prestigePoints||0)/2); while (GS.land.length < GS.maxLand) { var soils = ["normal","clay","sand","dark"]; GS.land.push({id:GS.land.length, unlocked:false, soil:soils[GS.land.length % 4]}); }
    return result;
};

// ===================================================================
// 3. doHarvest — 记录 lastCrop
// ===================================================================
var _doHarvest = doHarvest;
doHarvest = function(s) {
    if (s && s.crop) s.lastCrop = s.crop.id;
    return _doHarvest(s);
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
                if ((" " + card.className + " ").indexOf(" lk ") !== -1) {
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
    if ((" " + pp2.className + " ").indexOf(" ac ") !== -1 ) {
        
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
        h += '<div>\u{1f4e6} \u6536\u83b7\u4ea7\u51fa: <strong>2\u4e2a\u4f5c\u7269</strong></div>';
        h += '<div>\u23f1 \u751f\u957f\u65f6\u95f4: <strong>' + cd.g + '\u79d2</strong></div>';
        if (cd.soil) h += '<div>\u{1f3f7} \u6700\u4f73\u571f\u58e4: <strong>' + (cd.soil==='clay'?'\u7c98\u571f\u5730':cd.soil==='sand'?'\u6c99\u5730':cd.soil==='dark'?'\u9ed1\u571f\u5730':'\u666e\u901a\u571f\u5730') + '</strong>\uff08\u751f\u957f\u901f\u5ea6+50%\uff09</div>';
        else h += '<div>\u{1f3f7} \u571f\u58e4: \u65e0\u7279\u6b8a\u8981\u6c42</div>';
        h += '<div>\u{1f4e6} \u5e93\u5b58: <strong>' + totalHarvested + ' \u4e2a</strong></div>';
        h += '<div>\u{1f4b0} \u89e3\u9501\u9700\u8981\u7d2f\u8ba1: <strong>' + cd.unlock + '\u91d1\u5e01</strong></div>';
        h += '<div>\u{1f331} \u79cd\u690d\u6210\u672c: \u7ea6 <strong>' + Math.ceil(cd.v * 0.25) + '</strong> \u79cd\u5b50</div>';
        h += '<div>\u2728 \u6536\u83b7\u65f6: \u83b7\u5f972\u4e2a\u4f5c\u7269\u8d44\u6e90\uff0c30%\u6982\u7387\u8fd4\u8fd81\u9897\u79cd\u5b50</div>';
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
    return _startProc(k);
};
// ===================================================================
// 12. notify 包装 — 存储通知历史
// ===================================================================
GS._log = GS._log || [];
var _notify = notify;
notify = function(msg) {
    GS._log.push({time: Date.now(), text: msg});
    if (GS._log.length > 50) GS._log.shift();
    return _notify(msg);
};
window.showLog = function() {
    var overlay = document.getElementById("detailOverlay");
    var content = document.getElementById("detailContent");
    if (!overlay || !content) return;
    var h = '<h3 style="color:#ffd700">📋 事件记录</h3><div style="max-height:60vh;overflow-y:auto;text-align:left;font-size:.8em;line-height:1.6">';
    var logs = GS._log || [];
    for (var li = Math.max(0, logs.length - 30); li < logs.length; li++) {
        h += '<div style="padding:2px 0;border-bottom:1px solid rgba(255,255,255,.05)">' + logs[li].text + '</div>';
    }
    if (logs.length === 0) h += '<div class="tt">暂无事件记录</div>';
    h += '</div>';
    content.innerHTML = h;
    overlay.style.display = "flex";
};

// ===================================================================
// 13. renderFarm 后处理 — 浇水按钮 + 库存出售
// ===================================================================
var __renderFarm = renderFarm;
renderFarm = function() {
    __renderFarm();
    if (GS._planting >= 0) return;
    var pf2 = document.getElementById("pf");
    if (!pf2) return;

    // Water buttons on growing crops
    var slots = pf2.querySelectorAll(".sl[data-action='growing']");
    for (var wi = 0; wi < slots.length; wi++) {
        (function(slot, sidStr) {
            if (slot.querySelector(".waterBtn")) return;
            var sidNum = parseInt(sidStr);
            var wBtn = document.createElement("button");
            wBtn.className = "bt sm waterBtn";
            wBtn.style.cssText = "margin-top:3px;font-size:.65em;padding:2px 8px;background:linear-gradient(135deg,#4fc3f7,#0288d1)";
            wBtn.textContent = "💧 浇水";
            wBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                var s = GS.land[sidNum];
                if (!s || !s.crop) return;
                s.crop.timer += 15;
                notify("💧 浇水加速！+" + 15 + "s");
                renderFarm();
            });
            slot.appendChild(wBtn);
        })(slots[wi], slots[wi].getAttribute("data-sid"));
    }

    // Sell buttons in inventory section
    var invSpans = pf2.querySelectorAll(".cd:last-child span");
    for (var si = 0; si < invSpans.length; si++) {
        (function(span) {
            if (span.querySelector(".sellBtn")) return;
            var text = span.textContent;
            // Parse: "🌾 小麦 x2"
            var parts = text.split(" x");
            if (parts.length < 2) return;
            var iconAndName = parts[0].trim();
            var qty = parseInt(parts[1]);
            if (!qty || qty <= 0) return;
            // Find the item key
            var items = [
                {k:'wheat',icon:'🌾',n:'小麦',v:10},{k:'carrot',icon:'🥕',n:'胡萝卜',v:16},
                {k:'potato',icon:'🥔',n:'土豆',v:25},{k:'corn',icon:'🌽',n:'玉米',v:50},
                {k:'pumpkin',icon:'🎃',n:'南瓜',v:100},{k:'strawberry',icon:'🍓',n:'草莓',v:70},
                {k:'tomato',icon:'🍅',n:'番茄',v:35},{k:'pepper',icon:'🌶️',n:'辣椒',v:40},
                {k:'egg',icon:'🥚',n:'鸡蛋',v:15},{k:'milk',icon:'🥛',n:'牛奶',v:40},
                {k:'wool',icon:'🧶',n:'羊毛',v:60},{k:'truffle',icon:'🍄',n:'松露',v:150},
                {k:'flour',icon:'🌾📦',n:'面粉',v:20},{k:'bread',icon:'🍞',n:'面包',v:60},
                {k:'cheese',icon:'🧀',n:'奶酪',v:100},{k:'cloth',icon:'👘',n:'布料',v:150},
                {k:'smoked_pumpkin',icon:'🔥🎃',n:'烟熏南瓜',v:200},{k:'corn_wine',icon:'🍺🌽',n:'玉米酒',v:180},
                {k:'strawberry_jam',icon:'🍯🍓',n:'草莓果酱',v:220}
            ];
            var item = null;
            for (var ii = 0; ii < items.length; ii++) {
                if (iconAndName.indexOf(items[ii].icon) !== -1 && iconAndName.indexOf(items[ii].n) !== -1) {
                    item = items[ii]; break;
                }
            }
            if (!item) return;
            var sBtn = document.createElement("button");
            sBtn.className = "bt sm gn sellBtn";
            sBtn.style.cssText = "margin-left:4px;font-size:.6em;padding:1px 6px";
            var sellV=item.v*(1+GS.prestigePoints*0.1);sBtn.textContent = "卖" + Math.floor(sellV) + "💰";
            (function(it, sp) {
                sBtn.addEventListener("click", function(e) {
                    e.stopPropagation();
                    if (!GS.inventory[it.k] || GS.inventory[it.k] <= 0) return;
                    GS.inventory[it.k]--;
                    GS.coins += Math.floor(it.v*(1+GS.prestigePoints*0.1));
                    GS.totalCoinsEarned += Math.floor(it.v*(1+GS.prestigePoints*0.1));
                    notify("出售 " + it.icon + it.n + " +" + it.v + "💰");
                    renderFarm();
                    R();
                });
            })(item, span);
            span.appendChild(sBtn);
        })(invSpans[si]);
    }
};

// ===================================================================
// 14. renderAnimals 后处理 — 锁定卡片显示解锁条件
// ===================================================================
var __renderAnimals = renderAnimals;
renderAnimals = function() {
    __renderAnimals();
    var pa2 = document.getElementById("pa");
    if (!pa2) return;
    var cards = pa2.getElementsByClassName("sl");
    for (var ai = 0; ai < cards.length; ai++) {
        (function(card) {
            if (card.getAttribute("data-ai-inited")) return;
            card.setAttribute("data-ai-inited", "1");
            if ((" " + card.className + " ").indexOf(" lk ") === -1) return;
            var nameEl = card.querySelector("div:nth-child(2)");
            if (!nameEl) return;
            var cardName = nameEl.textContent.trim();
            for (var ak in ANIMAL_DEFS) {
                if (ANIMAL_DEFS[ak].n === cardName) {
                    var ad = ANIMAL_DEFS[ak];
                    var need = Math.max(0, ad.unlock - Math.floor(GS.totalCoinsEarned));
                    var infoEl = document.createElement("div");
                    infoEl.className = "tt";
                    infoEl.style.cssText = "margin-top:4px;color:" + (need > 0 ? "#ff9800" : "#66bb6a");
                    infoEl.textContent = need > 0 ? ("需累计" + ad.unlock + "💰 (还差" + need + ")") : ("已可购买！价格" + ad.c + "💰");
                    card.appendChild(infoEl);
                    break;
                }
            }
        })(cards[ai]);
    }
};

// ===================================================================
// 15. renderFarm 后处理 — 生长速度显示（含因素数据）
// ===================================================================
(function() {
    var _rf3 = renderFarm;
    renderFarm = function() {
        _rf3();
        if (GS._planting >= 0) return;
        var pf3 = document.getElementById("pf");
        if (!pf3) return;
        var wi2 = {sunny:"☀️ 晴天",cloudy:"⛅ 多云",rainy:"🌧️ 雨天",storm:"⛈️ 暴风雨"};
        var soilName2 = function(s){return s==="clay"?"粘土地":s==="sand"?"沙地":s==="dark"?"黑土地":"普通土地";}
        var slots2 = pf3.querySelectorAll(".sl[data-action='growing'], .sl[data-action='harvest']");
        for (var gi = 0; gi < slots2.length; gi++) {
            var slot = slots2[gi];
            if (slot.querySelector(".growRate")) continue;
            var sidStr2 = slot.getAttribute("data-sid");
            if (!sidStr2) continue;
            var s2 = GS.land[parseInt(sidStr2)];
            if (!s2 || !s2.crop) continue;
            var cd3 = CROP_DEFS[s2.crop.id];
            if (!cd3) continue;
            var gh2 = GS.upgrades.greenhouse;
            var gm2 = 1;
            var gmUpg = 0;
            var upgNames = [];
            for (var gk in UPG_DEFS) {
                if (GS.upgrades[gk] && UPG_DEFS[gk].ef === "grow") {
                    gmUpg += UPG_DEFS[gk].v;
                    upgNames.push(UPG_DEFS[gk].n + "+" + UPG_DEFS[gk].v.toFixed(1));
                }
            }
            gm2 += gmUpg;
            var gmWeather = 0;
            if (GS.weather === "rainy") gmWeather = 0.3;
            if (GS.weather === "sunny") gmWeather = 0.1;
            gm2 += gmWeather;
            if (GS.relics) { for (var gri = 0; gri < GS.relics.length; gri++) { var grd = RELIC_DEFS[GS.relics[gri]]; if (grd && grd.ef === "grow") gm2 += grd.v; } }
            var sb2 = {wheat:"spring",corn:"summer",pumpkin:"autumn",potato:"winter"};
            var so2 = !sb2[s2.crop.id] || sb2[s2.crop.id] === SNAMES[GS.season];
            var seasonMul = gh2 ? 1 : (so2 ? 1 : 0.5);
            var m2 = gh2 ? gm2 : (so2 ? gm2 : gm2 * 0.5);
            var soilMul = 1;
            if (cd3.soil && cd3.soil === s2.soil) { soilMul = 1.5; m2 *= 1.5; }
            var wName = wi2[GS.weather] || GS.weather;
            var sName = SICONS[GS.season] || SNAMES[GS.season];
            var soName = soilName2(s2.soil);
            var info = "1.0|" + gmUpg.toFixed(1) + "|" + gmWeather.toFixed(1) + wName + "|" + seasonMul.toFixed(1) + sName + "|" + soilMul.toFixed(1) + soName + "|" + (gh2?"1":"0") + "|" + m2.toFixed(2);
            var grEl = document.createElement("div");
            grEl.className = "tt growRate";
            grEl.setAttribute("data-gr-info", info);
            if (upgNames.length > 0) grEl.setAttribute("data-gr-upg", upgNames.join(","));
            grEl.style.cssText = "color:#4fc3f7;margin-top:2px;font-size:.7em;cursor:help";
            grEl.textContent = "🌱x" + m2.toFixed(1);
            slot.appendChild(grEl);
        }
    };
})();// 16. R() 后处理 — 计时事件倒计时显示
// ===================================================================
(function() {
    var _R2 = R;
    R = function() {
        _R2();
        var td = document.getElementById("timedEvents");
        if (!td) return;
        var msgs = [];
        if (window._doubleValue && window._doubleValueEnd) {
            var rem = Math.max(0, Math.ceil((window._doubleValueEnd - Date.now()) / 1000));
            if (rem > 0) {
                msgs.push("💰 双倍市价: " + rem + "秒");
            }
        }
        td.innerHTML = msgs.length > 0 ? msgs.join(" | ") : "";
        td.style.display = msgs.length > 0 ? "block" : "none";
    };
})();

// ===================================================================
// 17. renderTrade — 添加拒绝按钮
// ===================================================================
var _renderTrade = renderTrade;
renderTrade = function() {
    _renderTrade();
    var pt2 = document.getElementById("pt");
    if (!pt2) return;
    var offers = pt2.querySelectorAll(".mr");
    for (var oi = 0; oi < offers.length; oi++) {
        (function(row, idx) {
            if (row.querySelector(".rejectBtn")) return;
            var rBtn = document.createElement("button");
            rBtn.className = "bt sm rd rejectBtn";
            rBtn.style.cssText = "margin-left:6px;font-size:.65em;padding:2px 8px";
            rBtn.textContent = "❌ 拒绝";
            rBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                rejectOffer(idx);
                renderTrade();
            });
            row.appendChild(rBtn);
        })(offers[oi], oi);
    }
};

// ===================================================================
// 18. rejectOffer
// ===================================================================
window.rejectOffer = function(idx) {
    if (!GS.merchantOffers || idx >= GS.merchantOffers.length) return;
    var o = GS.merchantOffers[idx];
    GS.merchantOffers.splice(idx, 1);
    notify("❌ 拒绝了商人的“" + o.n + "”单子");
};

// ===================================================================
// 19. \u751F\u957F\u901F\u5EA6\u60AC\u6D6E\u63D0\u793A
// ===================================================================
(function() {
    var tooltip = null;
    var lastGrEl = null;
    function getTooltip() {
        if (!tooltip) {
            tooltip = document.createElement("div");
            tooltip.id = "growthTooltip";
            tooltip.style.cssText = "position:fixed;z-index:9999;background:rgba(30,30,30,.95);color:#e0e0e0;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.2);box-shadow:0 4px 20px rgba(0,0,0,.5);min-width:200px;pointer-events:none;font-size:.8em;display:none";
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }
    function hideTooltip() {
        var t = getTooltip();
        t.style.display = "none";
        lastGrEl = null;
    }
    function showTooltip(grEl, e) {
        if (grEl === lastGrEl) {
            // Same element, just reposition
            var t = getTooltip();
            var x = e.clientX + 15;
            var y = e.clientY - 10;
            if (x + t.offsetWidth > window.innerWidth) x = e.clientX - t.offsetWidth - 15;
            if (y + t.offsetHeight > window.innerHeight) y = window.innerHeight - t.offsetHeight - 5;
            if (x < 5) x = 5;
            if (y < 5) y = 5;
            t.style.left = x + "px";
            t.style.top = y + "px";
            return;
        }
        lastGrEl = grEl;
        var info = grEl.getAttribute("data-gr-info");
        if (!info) { hideTooltip(); return; }
        var parts = info.split("|");
        var base = parseFloat(parts[0]);
        var upgSum = parseFloat(parts[1]);
        var weatherStr = parts[2];
        var seasonStr = parts[3];
        var soilStr = parts[4];
        var hasGH = parts[5] === "1";
        var total = parseFloat(parts[6]);
        var upgNames = grEl.getAttribute("data-gr-upg") || "";
        
        var h = "<div style='font-size:.85em;line-height:1.6'>";
        h += "<div style='font-weight:bold;margin-bottom:4px;color:#ffd700'>\u{1F331} \u751F\u957F\u901F\u5EA6\u8BE6\u60C5</div>";
        h += "<div>\u57FA\u7840\u901F\u5EA6: <span style='color:#81c784'>x" + base.toFixed(1) + "</span></div>";
        
        if (upgSum > 0 && upgNames) {
            var unames = upgNames.split(",");
            for (var ui = 0; ui < unames.length; ui++) {
                h += "<div style='color:#ffab40'>  +\u5347\u7EA7: " + unames[ui] + "</div>";
            }
            h += "<div>\u5347\u7EA7\u5408\u8BA1: <span style='color:#ffab40'>+" + upgSum.toFixed(1) + "</span></div>";
        }
        
        var wv = parseFloat(weatherStr);
        var wn = weatherStr.replace(/^[\d.]+/, "");
        if (wv > 0) {
            h += "<div>\u5929\u6C14: " + wn + " <span style='color:#4fc3f7'>+" + wv.toFixed(1) + "</span></div>";
        } else {
            h += "<div>\u5929\u6C14: " + wn + " <span style='color:#888'>\u65E0\u52A0\u6210</span></div>";
        }
        
        var sv = parseFloat(seasonStr);
        var sn = seasonStr.replace(/^[\d.]+/, "");
        if (hasGH) {
            h += "<div>\u5B63\u8282: <span style='color:#ce93d8'>\u6E29\u5BA4\u65E0\u89C6\u5B63\u8282</span> x1.0</div>";
        } else if (sv >= 1) {
            h += "<div>\u5B63\u8282: " + sn + " <span style='color:#81c784'>\u5B63\u8282\u9002\u5B9C</span> x1.0</div>";
        } else {
            h += "<div>\u5B63\u8282: " + sn + " <span style='color:#ef5350'>\u53CD\u5B63\u8282</span> x0.5</div>";
        }
        
        var sov = parseFloat(soilStr);
        var son = soilStr.replace(/^[\d.]+/, "");
        if (sov > 1) {
            h += "<div>\u571F\u58E4: " + son + " <span style='color:#a5d6a7'>\u9002\u5408</span> x" + sov.toFixed(1) + "</div>";
        } else {
            h += "<div>\u571F\u58E4: " + son + " <span style='color:#888'>\u65E0\u52A0\u6210</span> x1.0</div>";
        }
        
        h += "<div style='border-top:1px solid rgba(255,255,255,.2);margin-top:4px;padding-top:4px;font-weight:bold'>\u5408\u8BA1: <span style='color:#ffd700;font-size:1.1em'>x" + total.toFixed(2) + "</span></div>";
        h += "</div>";
        
        var t = getTooltip();
        t.innerHTML = h;
        t.style.display = "block";
        
        var x = e.clientX + 15;
        var y = e.clientY - 10;
        if (x + t.offsetWidth > window.innerWidth) x = e.clientX - t.offsetWidth - 15;
        if (y + t.offsetHeight > window.innerHeight) y = window.innerHeight - t.offsetHeight - 5;
        if (x < 5) x = 5;
        if (y < 5) y = 5;
        t.style.left = x + "px";
        t.style.top = y + "px";
    }
    
    var pf = document.getElementById("pf");
    if (pf) {
        pf.addEventListener("mouseover", function(e) {
            var el = e.target;
            while (el && el !== pf && el !== document.body) {
                if (el.nodeType === 1 && (" " + el.className + " ").indexOf(" growRate ") !== -1) {
                    showTooltip(el, e);
                    return;
                }
                el = el.parentNode;
            }
            hideTooltip();
        });
        pf.addEventListener("mouseout", function(e) {
            var el = e.target;
            if (el && el.nodeType === 1 && (" " + el.className + " ").indexOf(" growRate ") !== -1) {
                var rel = e.relatedTarget;
                var p = rel;
                while (p && p !== document.body) {
                    if (p === el) return;
                    p = p.parentNode;
                }
                hideTooltip();
            }
        });
    }
})();


// ===================================================================
// 20. \u9632\u6B62\u6587\u5B57\u9009\u4E2D\u548C\u56FE\u7247\u62D6\u62FD
// ===================================================================
(function() {
    document.addEventListener("selectstart", function(e) {
        e.preventDefault();
    });
    document.addEventListener("dragstart", function(e) {
        e.preventDefault();
    });
    // \u9632\u6B62\u53CC\u51FB\u9009\u4E2D\u6587\u5B57
    document.addEventListener("mousedown", function(e) {
        if (e.detail > 1) {
            e.preventDefault();
        }
    });
})();



})();
