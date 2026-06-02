// ============================================================
// debug-panel.js — 隐秘调试面板
// 三击标题"农场增量"打开，可手动触发任意事件
// ============================================================
(function() {
    var clickCount = 0;
    var clickTimer = null;

    function init() {
        var title = document.querySelector("#header h1");
        if (!title) { setTimeout(init, 500); return; }

        title.style.cursor = "default";
        title.addEventListener("click", function(e) {
            clickCount++;
            if (clickTimer) clearTimeout(clickTimer);
            if (clickCount >= 3) {
                clickCount = 0;
                openPanel();
                return;
            }
            clickTimer = setTimeout(function() { clickCount = 0; }, 800);
        });
    }

    function openPanel() {
        // Remove existing
        var old = document.getElementById("debugOverlay");
        if (old) { old.remove(); return; }

        var events = DataRegistry.all("event");
        if (events.length === 0) { notify("事件列表为空"); return; }

        var h = '<div id="debugOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.92);z-index:10000;overflow-y:auto;padding:20px;font-family:Consolas,monospace">';
        h += '<div style="max-width:700px;margin:0 auto">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
        h += '<h2 style="color:#ffd700;margin:0">🔧 调试面板</h2>';
        h += '<button onclick="document.getElementById(\'debugOverlay\').remove()" style="background:#ef5350;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:.85em">关闭</button>';
        h += '</div>';

        h += '<div class="cd" style="margin:8px 0"><h3>📢 事件触发 (' + events.length + ' 个)</h3>';
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            var seen = GS._seenEvents && GS._seenEvents.indexOf(ev.n) !== -1;
            h += '<div class="mr">';
            h += '<div style="flex:1"><span style="color:' + (seen ? '#66bb6a' : '#888') + '">' + ev.i + ' ' + ev.n + '</span>';
            h += '<div class="tt">' + ev.d + '</div></div>';
            h += '<button onclick="window._dbgTrigger(\'' + ev.id + '\')" class="bt sm bl">触发</button>';
            h += '</div>';
        }
        h += '</div>';

        h += '<div class="cd" style="margin:8px 0"><h3>📊 游戏状态</h3>';
        h += '<div class="tt" style="line-height:1.8">';
        h += '金币:' + Math.floor(GS.coins).toLocaleString() + ' | 宝石:' + GS.gems + ' | 种子:' + (GS.inventory.seeds || 0) + '<br>';
        h += '年份:' + GS.year + ' | 季节:' + SNAMES[GS.season] + ' | 天气:' + GS.weather + '<br>';
        h += '累计金币:' + Math.floor(GS.totalCoinsEarned).toLocaleString() + ' | 收获次数:' + GS.totalCropsHarvested + '<br>';
        h += '已见事件:' + (GS._seenEvents ? GS._seenEvents.length : 0) + ' | 解锁作物:' + GS.discoveredCrops.length + '<br>';
        h += '</div></div>';

        h += '</div></div>';
        document.body.insertAdjacentHTML("beforeend", h);
    }

    window._dbgTrigger = function(eventId) {
        var ev = DataRegistry.get("event", eventId);
        if (!ev) { if (typeof notify === "function") notify("事件不存在: " + eventId); return; }

        // Track in _seenEvents
        if (!GS._seenEvents) GS._seenEvents = [];
        if (GS._seenEvents.indexOf(ev.n) === -1) GS._seenEvents.push(ev.n);

        // Execute
        try {
            ev.ef();
            if (typeof notify === "function") notify("已触发: " + ev.n);
        } catch(e) {
            if (typeof notify === "function") notify("触发失败: " + e.message);
            console.error("[Debug] Event error:", e);
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
