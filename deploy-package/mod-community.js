// ============================================================
// Mod 社区 v2 — 待选清单 + 创建新存档并应用模组
// ============================================================
(function() {
  var API_BASE = "/api";
  var authToken = localStorage.getItem("farm_mod_token") || "";
  var currentUser = null;
  try { var u = localStorage.getItem("farm_mod_user"); if (u) currentUser = JSON.parse(u); } catch (e) {}

  function setAuth(token, user) { authToken = token; currentUser = user; localStorage.setItem("farm_mod_token", token); localStorage.setItem("farm_mod_user", JSON.stringify(user)); }
  function clearAuth() { authToken = ""; currentUser = null; localStorage.removeItem("farm_mod_token"); localStorage.removeItem("farm_mod_user"); }

  function api(path, opts) {
    opts = opts || {}; var h = opts.headers || {}; h["Content-Type"] = "application/json";
    if (authToken) h["Authorization"] = "Bearer " + authToken;
    return fetch(API_BASE + path, { method: opts.method || "GET", headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function(r) { return r.json().then(function(d) { if (!r.ok) throw new Error(d.error || "请求失败"); return d; }); });
  }

  // ======== 待选清单（存 localStorage） ========
  function getSelection() { try { return JSON.parse(localStorage.getItem("farm_mod_selection") || "[]"); } catch(e) { return []; } }
  function setSelection(arr) { localStorage.setItem("farm_mod_selection", JSON.stringify(arr)); }
  function isSelected(id) { return getSelection().indexOf(id) !== -1; }
  function addToSelection(mod) {
    var sel = getSelection();
    if (sel.indexOf(mod.id) === -1) {
      sel.push(mod.id);
      setSelection(sel);
      // 下载并缓存 Mod 代码
      localStorage.setItem("farm_mod_code_" + mod.id, mod.file_content);
      localStorage.setItem("farm_mod_meta_" + mod.id, JSON.stringify({ name: mod.name, version: mod.version, author: mod.author, description: mod.description }));
    }
  }
  function removeFromSelection(id) {
    var sel = getSelection(); var idx = sel.indexOf(id);
    if (idx !== -1) { sel.splice(idx, 1); setSelection(sel); }
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // ======== 渲染 ========
  function loadList() {
    api("/mods").then(function(d) {
      var c = document.getElementById("modCommunityList"); if (!c) return;
      var mods = d.mods || [];
      if (mods.length === 0) { c.innerHTML = '<div style="text-align:center;color:#888;padding:20px">社区还没有 Mod，快来上传第一个吧！</div>'; return; }
      var sel = getSelection(); var h = "";
      for (var i = 0; i < mods.length; i++) {
        var m = mods[i]; var inSel = sel.indexOf(m.id) !== -1;
        h += '<div class="mr" style="flex-wrap:wrap">';
        h += '<div style="flex:1;min-width:150px"><div style="font-weight:bold;color:#ffcc80">' + esc(m.name) + '</div>';
        h += '<div class="tt">' + esc(m.description || "暂无描述") + '</div>';
        h += '<div class="tt">👤 ' + esc(m.author) + ' | v' + esc(m.version) + ' | ⬇ ' + (m.downloads||0) + ' | ❤ ' + (m.likes||0) + '</div></div>';
        h += '<div style="display:flex;gap:4px;align-items:center">';
        if (inSel) {
          h += '<button class="bt sm rd" onclick="window._mcRemoveSel(\'' + m.id + '\')">移出待选</button>';
        } else {
          h += '<button class="bt sm bl" onclick="window._mcAddSel(\'' + m.id + '\')">加入待选</button>';
        }
        h += '<button class="bt sm" onclick="api(\'/mods/' + m.id + '/like\',{method:\"POST\"}).then(function(){loadList();if(typeof notify===\"function\")notify(\"❤ 已点赞！\");})">❤</button>';
        h += '</div></div>';
      }
      c.innerHTML = h;
    }).catch(function(e) {
      var c = document.getElementById("modCommunityList");
      if (c) c.innerHTML = '<div style="text-align:center;color:#ef5350;padding:20px">加载失败: ' + esc(e.message) + '<br><button class="bt sm" onclick="loadList()">重试</button></div>';
    });
  }

  function renderSelection() {
    var panel = document.getElementById("modSelectionPanel"); if (!panel) return;
    var sel = getSelection();
    var h = '<div class="cd"><h3>📋 待选 Mod 清单 (' + sel.length + '个)</h3>';
    if (sel.length === 0) {
      h += '<div style="color:#888;text-align:center;padding:8px">暂未选择 Mod — 可创建纯净存档</div>';
    } else {
      for (var i = 0; i < sel.length; i++) {
        var meta = null;
        try { meta = JSON.parse(localStorage.getItem("farm_mod_meta_" + sel[i]) || "null"); } catch(e) {}
        h += '<div class="mr"><div style="flex:1"><span style="color:#ffcc80">' + esc((meta && meta.name) || sel[i]) + '</span> <span class="tt">v' + esc((meta && meta.version) || "") + '</span></div>';
        h += '<button class="bt sm rd" onclick="window._mcRemoveSel(\'' + sel[i] + '\')">移除</button></div>';
      }
    }
    h += '<div style="margin-top:10px"><button class="bt gn" onclick="window._mcCreateSave()">🎮 创建新存档' + (sel.length > 0 ? '并应用 ' + sel.length + ' 个模组' : '（纯净）') + '</button></div>';
    h += '</div>';
    panel.innerHTML = h;
  }

  window.renderModCommunity = function() {
    var p = document.getElementById("pmodcom");
    if (!p || (" " + p.className + " ").indexOf(" ac ") === -1) return;

    var h = '';
    // 用户状态
    h += '<div class="cd"><h3>📦 Mod 社区</h3>';
    if (currentUser) {
      h += '<div style="font-size:.85em;color:#aaa;margin-bottom:4px">👤 ' + esc(currentUser.username) + ' | <a href="#" onclick="event.preventDefault();window._mcLogout()" style="color:#ef5350">退出</a></div>';
      h += '<button class="bt sm bl" onclick="window._mcShowUpload()">📤 上传 Mod</button> ';
    } else {
      h += '<div style="font-size:.85em;color:#aaa;margin-bottom:4px"><a href="#" onclick="event.preventDefault();window._mcShowLogin()" style="color:#42a5f5">登录</a> / <a href="#" onclick="event.preventDefault();window._mcShowRegister()" style="color:#66bb6a">注册</a> </div>';
    }
    h += '<button class="bt sm gn" onclick="window.renderModCommunity()">🔄 刷新</button>';
    h += '</div>';

    p.innerHTML = h + '<div id="modSelectionPanel"></div><div class="cd" id="modCommunityList" style="max-height:55vh;overflow-y:auto"><div style="text-align:center;color:#888;padding:20px">加载中...</div></div>';

    renderSelection();
    loadList();
  };

  // ======== 按钮动作 ========
  window._mcAddSel = function(id) {
    api("/mods/" + id + "/download").then(function(d) {
      addToSelection(d);
      if (typeof notify === "function") notify("✅ '" + d.name + "' 已加入待选清单");
      renderSelection();
      loadList();
    }).catch(function(e) { if (typeof notify === "function") notify("❌ " + e.message); });
  };

  window._mcRemoveSel = function(id) {
    removeFromSelection(id);
    renderSelection();
    loadList();
    if (typeof notify === "function") notify("已从待选清单移除");
  };

  window._mcCreateSave = function() {
    var sel = getSelection();
    if (sel.length === 0 && !confirm("待选清单为空，将创建不含 Mod 的纯净存档。继续？")) return;

    // 构建槽位选择对话框
    var msg = "选择存档位（输入编号 0-4）：\n\n";
    for (var i = 0; i < 5; i++) {
      var info = window.getSaveSlotInfo ? window.getSaveSlotInfo(i) : null;
      var isCurrent = (window.__saveSlot || 0) === i;
      if (info) {
        msg += "  [" + i + "] " + (isCurrent ? "◀ 当前" : "  ") + " 💰" + info.coins + " 第" + info.year + "年 Mod:" + info.modCount + "个\n";
      } else {
        msg += "  [" + i + "] " + (isCurrent ? "◀ 当前" : "  ") + " (空)\n";
      }
    }
    msg += "\n" + (sel.length > 0 ? "将应用 " + sel.length + " 个 Mod" : "纯净存档（无 Mod）") + "\n覆盖已有存档将被永久删除！";

    // 用 prompt 选槽位
    var slotStr = prompt(msg, "0");
    if (slotStr === null) return;
    var slot = parseInt(slotStr);
    if (isNaN(slot) || slot < 0 || slot > 4) { alert("请输入 0-4 之间的数字"); return; }

    // 如果槽位有存档，确认覆盖
    var existing = window.getSaveSlotInfo ? window.getSaveSlotInfo(slot) : null;
    if (existing && !confirm("槽位 " + slot + " 已有存档（💰" + existing.coins + "），确定覆盖？")) return;

    doCreateSave(slot, sel);
  };

  function doCreateSave(slot, modIds) {
    // 确认现有存档（如果槽位非空）
    var info = window.getSaveSlotInfo ? window.getSaveSlotInfo(slot) : null;
    if (info) {
      if (!confirm("槽位 " + slot + " 已有存档（" + info.coins + "💰），覆盖？")) return;
    }

    // 删除旧存档
    localStorage.removeItem("farm_save_slot_" + slot);

    // 存储待创建存档的 Mod 清单（community-mod-loader 会消费）
    localStorage.setItem("farm_new_save_mods", JSON.stringify(modIds));

    // 切换到此槽位
    localStorage.setItem("farm_current_slot", String(slot));

    // 清空待选清单
    setSelection([]);

    // 重新加载页面（会触发 community-mod-loader 加载这些 Mod）
    if (typeof notify === "function") notify("🔄 正在创建新存档...");
    setTimeout(function() { location.reload(); }, 500);
  }

  window._mcLogout = function() { clearAuth(); if (typeof notify === "function") notify("👋 已退出"); renderModCommunity(); };

  // ======== 弹窗表单 ========
  window._mcCloseForm = function() { var el = document.getElementById("mcFormOverlay"); if (el) el.remove(); };

  function showForm(title, fields, cb) {
    var ov = document.getElementById("mcFormOverlay"); if (ov) ov.remove();
    ov = document.createElement("div"); ov.id = "mcFormOverlay";
    ov.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center";
    var h = '<div style="background:linear-gradient(180deg,#1a0a00,#3d1c00);border:2px solid #8b5a2b;border-radius:14px;padding:24px;max-width:420px;width:90%;color:#f0e0c0;max-height:90vh;overflow-y:auto;font-family:\"Segoe UI\",\"Microsoft YaHei\",sans-serif">';
    h += '<h3 style="color:#ffd700;margin-bottom:12px">' + esc(title) + '</h3>';
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      h += '<div style="margin-bottom:8px"><label style="font-size:.82em;color:#aaa;display:block;margin-bottom:3px">' + esc(f.label) + '</label>';
      if (f.type === "textarea") h += '<textarea id="' + f.id + '" placeholder="' + esc(f.placeholder||"") + '" style="width:100%;min-height:120px;background:rgba(0,0,0,.3);border:1px solid #555;border-radius:6px;color:#f0e0c0;padding:8px;font-family:Consolas,monospace;font-size:.82em;resize:vertical"></textarea>';
      else h += '<input type="' + (f.type||"text") + '" id="' + f.id + '" placeholder="' + esc(f.placeholder||"") + '" style="width:100%;background:rgba(0,0,0,.3);border:1px solid #555;border-radius:6px;color:#f0e0c0;padding:8px;font-size:.9em">';
      h += '</div>';
    }
    h += '<div style="margin-top:14px;display:flex;gap:8px"><button onclick="window._mcSubmitForm()" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;font-size:.95em;font-weight:bold;color:#1a0a00;background:linear-gradient(135deg,#ffd700,#ffaa00)">确认</button>';
    h += '<button onclick="window._mcCloseForm()" style="flex:1;padding:10px;border-radius:8px;border:1px solid #555;cursor:pointer;font-size:.95em;color:#aaa;background:transparent">取消</button></div></div>';
    ov.innerHTML = h; ov._fields = fields; ov._cb = cb; document.body.appendChild(ov);
  }

  window._mcSubmitForm = function() {
    var ov = document.getElementById("mcFormOverlay"); if (!ov || !ov._cb) return;
    var values = {};
    for (var i = 0; i < ov._fields.length; i++) {
      var f = ov._fields[i]; var el = document.getElementById(f.id);
      values[f.id] = el ? el.value : "";
    }
    ov._cb(values);
  };

  window._mcShowLogin = function() {
    showForm("登录", [{label:"用户名", id:"mc_u"},{label:"密码", id:"mc_p", type:"password"}], function(v) {
      api("/auth/login", {method:"POST", body:{username:v.mc_u, password:v.mc_p}})
        .then(function(d) { setAuth(d.token, d.user); if (typeof notify === "function") notify("✅ 欢迎 " + d.user.username); renderModCommunity(); document.getElementById("mcFormOverlay").remove(); })
        .catch(function(e) { alert("登录失败: " + e.message); });
    });
  };

  window._mcShowRegister = function() {
    showForm("注册", [{label:"用户名", id:"mc_ru"},{label:"密码", id:"mc_rp", type:"password"},{label:"确认密码", id:"mc_rp2", type:"password"}], function(v) {
      if (v.mc_rp !== v.mc_rp2) { alert("两次密码不一致"); return; }
      api("/auth/register", {method:"POST", body:{username:v.mc_ru, password:v.mc_rp}})
        .then(function(d) { setAuth(d.token, d.user); if (typeof notify === "function") notify("✅ 欢迎 " + d.user.username); renderModCommunity(); document.getElementById("mcFormOverlay").remove(); })
        .catch(function(e) { alert("注册失败: " + e.message); });
    });
  };

  window._mcShowUpload = function() {
    showForm("上传 Mod", [
      {label:"Mod ID (英文)", id:"mc_uid", placeholder:"my_cool_mod"},
      {label:"名称", id:"mc_uname"}, {label:"描述", id:"mc_udesc"},
      {label:"版本", id:"mc_uver", placeholder:"1.0"},
      {label:"JS 代码", id:"mc_ucode", type:"textarea", placeholder:"DataRegistry.register('crop', {...}, {modId: 'xxx'});"}
    ], function(v) {
      api("/mods", {method:"POST", body:{id:v.mc_uid, name:v.mc_uname, description:v.mc_udesc, version:v.mc_uver, file_content:v.mc_ucode}})
        .then(function(d) { if (typeof notify === "function") notify("✅ " + d.message); renderModCommunity(); document.getElementById("mcFormOverlay").remove(); })
        .catch(function(e) { alert("上传失败: " + e.message); });
    });
  };

  // ======== Tab 注册 ========
  function addTab() {
    var tabs = document.getElementById("tabs"); if (!tabs) return setTimeout(addTab, 500);
    if (document.getElementById("tabModCommunity")) return;
    var btn = document.createElement("button"); btn.className = "tb"; btn.id = "tabModCommunity"; btn.setAttribute("data-pn", "modcom"); btn.textContent = "📦 模组社区";
    var sysTab = tabs.querySelector('[data-pn="system"]'); if (sysTab) tabs.insertBefore(btn, sysTab); else tabs.appendChild(btn);
    var panel = document.createElement("div"); panel.className = "pn"; panel.id = "pmodcom"; (document.getElementById("pf")?.parentNode || document.body).appendChild(panel);
  }

  function init() {
    addTab();
    var _renderAll = window.renderAll || function(){};
    window.renderAll = function() { _renderAll(); if (typeof renderModCommunity === "function") renderModCommunity(); };
    var tabs = document.getElementById("tabs");
    if (tabs) tabs.addEventListener("click", function() { setTimeout(function() {
      var at = tabs.querySelector(".tb.ac");
      if (at && at.getAttribute("data-pn") === "modcom") {
        var allPanels = document.querySelectorAll(".pn");
        for (var pi = 0; pi < allPanels.length; pi++) allPanels[pi].classList.remove("ac");
        var modPanel = document.getElementById("pmodcom");
        if (modPanel) modPanel.classList.add("ac");
        renderModCommunity();
      }
    }, 50); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
