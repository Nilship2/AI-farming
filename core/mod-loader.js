// ============================================================
// Mod 加载器 — 纯开关，无动态加载
// Mod 脚本始终注册，DataRegistry 根据启用状态过滤
// ============================================================
(function() {
    var manifest = window.__modManifest || [];
    
    function getSavedMods() {
        try {
            var raw = localStorage.getItem("farm_save");
            if (!raw) return null;
            var save = JSON.parse(raw);
            return save._enabledMods !== undefined ? save._enabledMods : null;
        } catch(e) { return null; }
    }
    
    function validateMods(enabledIds) {
        var missing = [];
        for (var i = 0; i < enabledIds.length; i++) {
            var found = false;
            for (var j = 0; j < manifest.length; j++) {
                if (manifest[j].id === enabledIds[i]) { found = true; break; }
            }
            if (!found) missing.push(enabledIds[i]);
        }
        return missing;
    }
    
    function injectStyles() {
        if (document.getElementById("modStyles")) return;
        var style = document.createElement("style");
        style.id = "modStyles";
        style.textContent = 
            "#modOverlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:'Segoe UI','Microsoft YaHei',sans-serif}" +
            "#modBox{background:linear-gradient(180deg,#1a0a00,#3d1c00);border:2px solid #8b5a2b;border-radius:16px;padding:28px;max-width:520px;width:90%;color:#f0e0c0;max-height:85vh;overflow-y:auto}" +
            "#modBox h2{color:#ffd700;text-align:center;margin-bottom:8px}" +
            "#modBox .sub{text-align:center;color:#aaa;font-size:.85em;margin-bottom:18px}" +
            ".modItem{display:flex;align-items:center;padding:10px 12px;margin:6px 0;background:rgba(255,255,255,.05);border-radius:8px;cursor:pointer;gap:10px;border:2px solid transparent}" +
            ".modItem:hover{border-color:rgba(255,215,0,.3)}" +
            ".modItem.sel{border-color:#ffd700;background:rgba(255,215,0,.08)}" +
            ".modItem .cb{width:20px;height:20px;border-radius:4px;border:2px solid #888;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px}" +
            ".modItem.sel .cb{background:#ffd700;border-color:#ffd700;color:#1a0a00}" +
            ".modItem .info{flex:1}" +
            ".modItem .name{font-weight:bold;color:#ffcc80}" +
            ".modItem .desc{font-size:.78em;color:#999;margin-top:2px}" +
            ".modItem .ver{font-size:.7em;color:#666}" +
            "#modBox .actions{margin-top:18px;text-align:center}" +
            "#modBox .actions button{padding:10px 30px;border-radius:8px;border:none;cursor:pointer;font-size:1em;font-weight:bold;color:#1a0a00;background:linear-gradient(135deg,#ffd700,#ffaa00);margin:4px 6px;font-family:inherit}" +
            "#modBox .actions button:hover{box-shadow:0 3px 14px rgba(255,180,0,.5)}" +
            "#modBox .actions button.ghost{background:transparent;color:#aaa;border:1px solid #555}" +
            "#modBox .err{background:rgba(239,83,80,.15);border:1px solid #ef5350;border-radius:8px;padding:12px;margin:10px 0;font-size:.85em;color:#ef5350}" +
            "#modBox .err code{display:block;background:rgba(0,0,0,.3);padding:6px 10px;border-radius:4px;margin-top:6px;font-size:.8em;color:#ffcc80;word-break:break-all;max-height:120px;overflow-y:auto}";
        document.head.appendChild(style);
    }
    
    function showSelectionUI() {
        injectStyles();
        var overlay = document.createElement("div");
        overlay.id = "modOverlay";
        var h = '<div id="modBox">';
        h += '<h2>🌾 农场增量</h2>';
        h += '<div class="sub">首次游玩 — 请选择要启用的 Mod</div>';
        for (var i = 0; i < manifest.length; i++) {
            var m = manifest[i];
            h += '<div class="modItem sel" data-mid="' + m.id + '" onclick="this.classList.toggle(\'sel\')">';
            h += '<div class="cb">✓</div>';
            h += '<div class="info"><div class="name">' + m.name + '</div>';
            h += '<div class="desc">' + m.desc + '</div></div>';
            h += '<div class="ver">v' + m.version + '</div></div>';
        }
        h += '<div class="actions">';
        h += '<button onclick="window.__modLoader.confirm()">🎮 开始游戏</button>';
        h += '<button class="ghost" onclick="window.__modLoader.toggleAll(true)">全选</button>';
        h += '<button class="ghost" onclick="window.__modLoader.toggleAll(false)">全不选</button>';
        h += '</div></div>';
        overlay.innerHTML = h;
        document.body.appendChild(overlay);
    }
    
    function showMissingUI(missingMods, rawSave) {
        injectStyles();
        var overlay = document.createElement("div");
        overlay.id = "modOverlay";
        var h = '<div id="modBox">';
        h += '<h2>⚠️ Mod 不匹配</h2>';
        h += '<div class="sub">存档引用了以下不存在的 Mod：</div>';
        h += '<div class="err">';
        for (var i = 0; i < missingMods.length; i++) {
            h += '<div>❌ ' + missingMods[i] + '</div>';
        }
        h += '</div>';
        h += '<p style="font-size:.82em;color:#aaa;margin:10px 0">请重新安装这些 Mod 后刷新页面。<br>以下是你的存档数据（可复制保存）：</p>';
        h += '<div class="err"><code>' + rawSave.replace(/</g,'&lt;') + '</code></div>';
        h += '<div class="actions">';
        h += '<button onclick="navigator.clipboard.writeText(document.querySelector(\'#modBox code\').textContent);alert(\'存档已复制！\')">📋 复制存档</button>';
        h += '<button class="ghost" onclick="if(confirm(\'确定删除存档？\')){localStorage.removeItem(\'farm_save\');location.reload();}">🗑️ 删档重来</button>';
        h += '</div></div>';
        overlay.innerHTML = h;
        document.body.appendChild(overlay);
    }
    
    window.__modLoader = {
        confirm: function() {
            var items = document.querySelectorAll(".modItem.sel");
            var ids = [];
            for (var i = 0; i < items.length; i++) {
                ids.push(items[i].getAttribute("data-mid"));
            }
            // 启用选中的 Mod（其余自动禁用）
            DataRegistry.setEnabledMods(ids);
            window.__enabledMods = ids;
            var overlay = document.getElementById("modOverlay");
            if (overlay) overlay.remove();
            // 重建桥接以反映 Mod 选择
            if (typeof rebuildBridge === "function") rebuildBridge();
            // 启动游戏
            if (typeof startGame === "function") startGame();
        },
        toggleAll: function(sel) {
            var items = document.querySelectorAll(".modItem");
            for (var i = 0; i < items.length; i++) {
                if (sel) items[i].classList.add("sel");
                else items[i].classList.remove("sel");
            }
        }
    };
    
    // ====== 主流程 ======
    var savedMods = getSavedMods();
    
    if (savedMods !== null) {
        // 有存档：验证并设置
        var missing = validateMods(savedMods);
        if (missing.length > 0) {
            showMissingUI(missing, localStorage.getItem("farm_save") || "");
            DataRegistry.setEnabledMods([]);
            window.__enabledMods = [];
            window.__modSelectionPending = true;
        } else {
            DataRegistry.setEnabledMods(savedMods);
            window.__enabledMods = savedMods;
        }
    } else if (manifest.length > 0) {
        // 无存档 + 有 Mod：显示选择 UI
        showSelectionUI();
        DataRegistry.setEnabledMods([]);
        window.__enabledMods = [];
        window.__modSelectionPending = true;
    } else {
        // 无存档 + 无 Mod
        DataRegistry.setEnabledMods([]);
        window.__enabledMods = [];
    }
})();