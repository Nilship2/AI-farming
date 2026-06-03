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

  // 本地点赞记录（防止重复点击）
  function getLikedMods() { try { return JSON.parse(localStorage.getItem("farm_mod_liked") || "[]"); } catch(e) { return []; } }
  function addLikedMod(id) { var arr = getLikedMods(); if (arr.indexOf(id) === -1) { arr.push(id); localStorage.setItem("farm_mod_liked", JSON.stringify(arr)); } }
  function isLikedLocally(id) { return getLikedMods().indexOf(id) !== -1; }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // ======== 渲染 ========
  var _mcSort = "downloads";
  var _mcPage = 1;
  var _mcSearch = "";

  function loadList() {
    var params = "?sort=" + _mcSort + "&page=" + _mcPage + "&pageSize=10";
    if (_mcSearch) params += "&search=" + encodeURIComponent(_mcSearch);
    api("/mods" + params).then(function(d) {
      var c = document.getElementById("modCommunityList"); if (!c) return;
      var mods = d.mods || [];
      
      // Sort bar
      var h = '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;align-items:center">';
      h += '<input type="text" id="mcSearchInput" value="' + esc(_mcSearch) + '" placeholder="搜索 Mod..." style="flex:1;min-width:120px;background:rgba(0,0,0,.3);border:1px solid #555;border-radius:6px;color:#f0e0c0;padding:5px 8px;font-size:.82em" onkeydown="if(event.key===\'Enter\')window._mcDoSearch()">';
      h += '<button class="bt sm" onclick="window._mcDoSearch()">🔍</button>';
      var sorts = [
        {k:"downloads", n:"⬇ 下载量"},
        {k:"likes", n:"❤ 点赞数"},
        {k:"updated", n:"🕐 最新"}
      ];
      for (var si = 0; si < sorts.length; si++) {
        var s = sorts[si];
        h += '<button class="bt sm' + (_mcSort === s.k ? ' gn' : '') + '" onclick="window._mcSetSort(\'' + s.k + '\')">' + s.n + '</button>';
      }
      h += '</div>';

      if (mods.length === 0) {
        h += '<div style="text-align:center;color:#888;padding:20px">' + (_mcSearch ? '没有匹配的 Mod' : '社区还没有 Mod，快来上传第一个吧！') + '</div>';
      } else {
        var sel = getSelection();
        for (var i = 0; i < mods.length; i++) {
          var m = mods[i]; var inSel = sel.indexOf(m.id) !== -1;
          h += '<div class="mr" style="flex-wrap:wrap">';
          h += '<div style="flex:1;min-width:150px"><div style="font-weight:bold;color:#ffcc80">' + esc(m.name) + '</div>';
          h += '<div class="tt">' + esc(m.description || "暂无描述") + '</div>';
          h += '<div class="tt">👤 ' + esc(m.author) + ' | v' + esc(m.version) + ' | ⬇ ' + (m.downloads||0) + ' | ❤ ' + (m.likes||0) + '</div>';
          if(m.updated_at)h+='<div class="tt" style="font-size:.72em;color:#888">🕐 ' + m.updated_at.replace('T',' ').substring(0,16) + '</div>';
          h += '</div>';
          h += '<div style="display:flex;gap:4px;align-items:center">';
          if (inSel) {
            h += '<button class="bt sm rd" onclick="window._mcRemoveSel(\'' + m.id + '\')">移出待选</button>';
          } else {
            h += '<button class="bt sm bl" onclick="window._mcAddSel(\'' + m.id + '\')">加入待选</button>';
          }
          if (isLikedLocally(m.id)) {
            h += '<button class="bt sm" style="opacity:0.4;cursor:default" disabled title="已点赞过此 Mod">❤ 已点赞</button>';
          } else {
            h += '<button class="bt sm" onclick="window._mcLikeMod(\'' + m.id + '\')">❤</button>';
          }
          h += '</div></div>';
        }
      }

      // Pagination
      if (d.totalPages > 1) {
        h += '<div style="text-align:center;margin-top:10px;display:flex;gap:4px;justify-content:center;flex-wrap:wrap">';
        h += '<button class="bt sm" onclick="window._mcGoPage(' + (d.page - 1) + ')"' + (d.page <= 1 ? ' disabled style="opacity:0.3"' : '') + '>◀</button>';
        h += '<span style="color:#aaa;font-size:.82em;padding:4px 8px">' + d.page + ' / ' + d.totalPages + '</span>';
        h += '<button class="bt sm" onclick="window._mcGoPage(' + (d.page + 1) + ')"' + (d.page >= d.totalPages ? ' disabled style="opacity:0.3"' : '') + '>▶</button>';
        h += '</div>';
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
    if (!p) return;

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
    h += '<button class="bt sm pu" onclick="window._mcOpenAI()">🤖 AI 开发</button>';
    h += '</div>';

    p.innerHTML = h + '<div id="modSelectionPanel"></div><div class="cd" id="modCommunityList" style="max-height:55vh;overflow-y:auto"><div style="text-align:center;color:#888;padding:20px">加载中...</div></div>';

    renderSelection();
    loadList();
  };

  window._mcSetSort = function(s) { _mcSort = s; _mcPage = 1; loadList(); };
  window._mcDoSearch = function() { var el = document.getElementById("mcSearchInput"); _mcSearch = el ? el.value.trim() : ""; _mcPage = 1; loadList(); };
  window._mcGoPage = function(p) { if (p < 1) return; _mcPage = p; loadList(); };


  // ======== AI 开发面板 ========
  var _aiGenerating = false;

  window._mcOpenAI = function() {
    var ov = document.createElement("div");
    ov.id = "mcAIOverlay";
    ov.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.92);z-index:10001;overflow-y:auto;padding:20px;font-family:inherit";
    
    var h = '<div style="max-width:750px;margin:0 auto">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
    h += '<h2 style="color:#ffd700;margin:0">🤖 AI 模组开发</h2>';
    h += '<button onclick="document.getElementById(\'mcAIOverlay\').remove()" style="background:#ef5350;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:.85em">关闭</button>';
    h += '</div>';
    
    h += '<div class="cd" style="margin-bottom:12px">';
    h += '<div style="color:#aaa;font-size:.85em;margin-bottom:8px">用自然语言描述你想要的 Mod，AI 将为你生成代码。</div>';
    h += '<textarea id="mcAIPrompt" placeholder="例如：添加一种叫星光莓的作物，生长60秒，价值500金币，解锁需要累计10000金币" style="width:100%;height:80px;background:rgba(0,0,0,.3);border:1px solid #555;border-radius:6px;color:#f0e0c0;padding:10px;font-size:.9em;font-family:inherit;resize:vertical"></textarea>';
    h += '<div style="margin-top:10px;display:flex;gap:8px">';
    h += '<button id="mcAIGenBtn" onclick="window._mcAIGenerate()" class="bt gn" style="flex:1;padding:10px;font-size:.95em">✨ 生成 Mod</button>';
    h += '<button onclick="window._mcAILoadExisting()" class="bt sm" style="padding:10px;font-size:.85em">📂 加载已有 Mod</button>';
    h += '</div></div>';
    
    h += '<div class="cd" id="mcAIResult" style="display:none">';
    h += '<h3>📝 生成结果</h3>';
    h += '<div id="mcAIInfo" style="margin-bottom:8px"></div>';
    h += '<textarea id="mcAICode" readonly style="width:100%;height:200px;background:rgba(0,0,0,.5);border:1px solid #555;border-radius:6px;color:#c0e0c0;padding:10px;font-family:Consolas,monospace;font-size:.82em;resize:vertical"></textarea>';
    h += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
    h += '<button onclick="window._mcAICopy()" class="bt sm bl">📋 复制代码</button>';
    h += '<button onclick="window._mcAISaveLocal()" class="bt sm gn">暂存至本地并立刻试用</button>';
    h += '<button onclick="window._mcAIUpload()" class="bt sm pu">📤 上传到社区</button>';
    h += '<label style="display:flex;align-items:center;gap:4px;font-size:.82em;color:#aaa;margin-left:8px"><input type="checkbox" id="mcAIPublic" checked> 公开</label>';
    h += '<button onclick="window._mcAILoadExisting()" class="bt sm" style="padding:10px;font-size:.85em">📂 加载已有 Mod</button>';
    h += '</div></div>';
    
    h += '<div id="mcAILoading" style="display:none;text-align:center;padding:30px;color:#ffd700">🤔 AI 正在思考中...</div>';
    h += '</div>';
    ov.innerHTML = h;
    document.body.appendChild(ov);
  };

  window._mcAIGenerate = function() {
    console.log('[AI] clicked, _aiGenerating='+_aiGenerating);
    if (_aiGenerating) { console.log('[AI] blocked'); return; }
    var promptEl = document.getElementById("mcAIPrompt");
    console.log('[AI] promptEl='+(promptEl?promptEl.value.length:'null'));
    var prompt = promptEl ? promptEl.value.trim() : "";
    if (prompt.length < 5) {
      console.log('[AI] prompt too short: '+prompt.length);
      alert('提示：请至少输入5个字。当前长度：'+prompt.length);
      return;
    }
    
    _aiGenerating = true;
    var btn = document.getElementById("mcAIGenBtn");
    if (btn) { btn.disabled = true; btn.textContent = "生成中..."; }
    var loading = document.getElementById("mcAILoading");
    if (loading) loading.style.display = "block";
    var result = document.getElementById("mcAIResult");
    if (result) result.style.display = "none";
    
    var existingCode = (document.getElementById("mcAICode")||{}).value || "";
    var finalPrompt = prompt;
    if (existingCode.trim()) { finalPrompt = "现有Mod代码：\\n" + existingCode + "\\n\\n用户需求：" + prompt + "\\n\\n请基于现有代码进行修改，保持原有结构，仅做用户描述的改动。"; }
    console.log('[AI] Calling API...'); api("/ai/generate", { method: "POST", body: { prompt: finalPrompt, existing_code: existingCode } }).then(function(d) {
      _aiGenerating = false;
      if (btn) { btn.disabled = false; btn.textContent = "✨ 生成 Mod"; }
      if (loading) loading.style.display = "none";
      
      var info = document.getElementById("mcAIInfo");
      if (info) info.innerHTML = '<div style="color:#ffcc80;font-weight:bold">' + esc(d.name) + '</div><div class="tt">' + esc(d.description) + '</div>';
      var codeEl = document.getElementById("mcAICode");
      if (codeEl) codeEl.value = d.code;
      if (result) result.style.display = "block";
      
      if (typeof notify === "function") notify("✅ AI 已生成: " + d.name);
    }).catch(function(e) {
      _aiGenerating = false;
      if (btn) { btn.disabled = false; btn.textContent = "✨ 生成 Mod"; }
      if (loading) loading.style.display = "none";
      if (typeof notify === "function") notify("❌ " + e.message);
    });
  };

  window._mcAICopy = function() {
    console.log('[AI] Copy clicked');
    var codeEl = document.getElementById("mcAICode");
    if (!codeEl) { console.log('[AI] Copy: no codeEl'); return; }
    var text = codeEl.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      console.log('[AI] Copy: using clipboard API');
      navigator.clipboard.writeText(text).then(function() {
        console.log('[AI] Copy: success');
        if (typeof notify === "function") notify("✅ 代码已复制");
      }).catch(function() { console.log('[AI] Copy: clipboard failed, fallback'); copyFallback(codeEl, text); });
    } else {
      console.log('[AI] Copy: no clipboard API, fallback');
      copyFallback(codeEl, text);
    }
    function copyFallback(el, txt) {
      el.select(); el.setSelectionRange(0, 99999);
      try { document.execCommand("copy"); console.log('[AI] Copy: execCommand ok'); if (typeof notify === "function") notify("✅ 已复制 (Ctrl+C)"); }
      catch(e) { console.log('[AI] Copy: execCommand failed'); if (typeof notify === "function") notify("📋 请手动复制"); }
    }
  };

  window._mcAISaveLocal = function() {
    console.log('[AI] SaveLocal clicked');
    var codeEl = document.getElementById("mcAICode");
    var code = codeEl ? codeEl.value.trim() : "";
    console.log('[AI] SaveLocal: code len=' + (code ? code.length : 0));
    if (!code) { console.log('[AI] SaveLocal: no code'); if (typeof notify === "function") notify("没有代码可保存"); return; }
    
    var idMatch = code.match(/modId\s*:\s*["']([^"']+)["']/) || code.match(/id\s*:\s*["']([^"']+)["']/);
    var modId = idMatch ? idMatch[1] : "ai_mod_" + Date.now();
    console.log('[AI] SaveLocal: modId=' + modId);
    var infoEl = document.getElementById("mcAIInfo");
    var nameDivEl = infoEl ? infoEl.querySelector("div") : null;
    var nameText = nameDivEl ? (nameDivEl.textContent || "AI Mod") : "AI Mod";
    var descText = infoEl ? ((infoEl.querySelector(".tt")||{}).textContent || "") : "";
    console.log('[AI] SaveLocal: name=' + nameText);
    
    try {
      localStorage.setItem("farm_mod_code_" + modId, code);
      console.log('[AI] SaveLocal: localStorage code saved');
      localStorage.setItem("farm_mod_meta_" + modId, JSON.stringify({ name: nameText, version: "1.0", author: (currentUser||{}).username || "AI", description: descText }));
      console.log('[AI] SaveLocal: localStorage meta saved');
    } catch(e) {
      console.error('[AI] SaveLocal: localStorage error', e);
      if (typeof notify === "function") notify("❌ 保存失败: " + e.message);
      return;
    }
    
    var sel = getSelection();
    console.log('[AI] SaveLocal: selection before=' + JSON.stringify(sel));
    if (sel.indexOf(modId) === -1) { sel.push(modId); setSelection(sel); }
    console.log('[AI] SaveLocal: selection after=' + JSON.stringify(sel));
    
    if (!window.__modManifest) window.__modManifest = [];
    var found = false;
    for (var mi = 0; mi < window.__modManifest.length; mi++) {
      if (window.__modManifest[mi].id === modId) { found = true; break; }
    }
    if (!found) {
      window.__modManifest.push({ id: modId, name: nameText, file: "(ai)", desc: descText, version: "1.0", community: true });
    }
    console.log('[AI] SaveLocal: manifest updated, found=' + found + ', total=' + window.__modManifest.length);
    
    if (typeof notify === "function") { console.log('[AI] SaveLocal: calling notify'); notify("💾 已保存: " + nameText + " (ID: " + modId + ")"); }
    console.log('[AI] SaveLocal: calling renderSelection');
    renderSelection();
    console.log('[AI] SaveLocal: calling loadList');
    loadList();
    console.log('[AI] SaveLocal: done');
  };

  
  window._mcAILoadExisting = function() {
    console.log('[AI] LoadExisting clicked');
    // Collect mods from localStorage + __modManifest
    var mods = [];
    var seen = {};
    // From __modManifest
    if (window.__modManifest) {
      for (var i = 0; i < window.__modManifest.length; i++) {
        var m = window.__modManifest[i];
        if (!seen[m.id]) { seen[m.id] = true; mods.push(m); }
      }
    }
    // From localStorage
    for (var k in localStorage) {
      if (k.indexOf("farm_mod_meta_") === 0) {
        try {
          var meta = JSON.parse(localStorage.getItem(k));
          var id = k.replace("farm_mod_meta_", "");
          if (meta && !seen[id]) { seen[id] = true; mods.push({ id: id, name: meta.name || id, desc: meta.description || "", version: meta.version || "1.0" }); }
        } catch(e) {}
      }
    }
    console.log('[AI] LoadExisting: found ' + mods.length + ' mods');
    
    if (mods.length === 0) {
      if (typeof notify === "function") notify("没有找到已保存的 Mod");
      return;
    }
    
    // Show popup
    var popup = document.createElement("div");
    popup.id = "mcLoadPopup";
    popup.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.85);z-index:10010;display:flex;align-items:center;justify-content:center";
    var h = '<div style="background:#1a1a2e;border:1px solid #555;border-radius:12px;padding:20px;max-width:500px;width:90%;max-height:70vh;overflow-y:auto">';
    h += '<h3 style="color:#ffd700;margin:0 0 12px 0">📂 选择要加载的 Mod</h3>';
    for (var mi = 0; mi < mods.length; mi++) {
      var mod = mods[mi];
      h += '<div onclick="window._mcLoadExistingMod(\'' + esc(mod.id) + '\')" style="padding:10px;margin-bottom:6px;background:rgba(255,255,255,.05);border:1px solid #444;border-radius:8px;cursor:pointer;transition:background .2s" onmouseover="this.style.background=\'rgba(255,215,0,.15)\'" onmouseout="this.style.background=\'rgba(255,255,255,.05)\'">';
      h += '<div style="color:#f0e0c0;font-weight:bold">' + esc(mod.name || mod.id) + '</div>';
      h += '<div style="color:#888;font-size:.78em">ID: ' + esc(mod.id) + ' | ' + esc(mod.version || "?") + (mod.desc ? ' | ' + esc(mod.desc).substring(0,50) : '') + '</div>';
      h += '</div>';
    }
    h += '<button onclick="document.getElementById(\'mcLoadPopup\').remove()" style="margin-top:12px;width:100%;padding:8px;background:#555;color:#fff;border:none;border-radius:6px;cursor:pointer">取消</button>';
    h += '</div>';
    popup.innerHTML = h;
    document.body.appendChild(popup);
  };

  window._mcLoadExistingMod = function(modId) {
    console.log('[AI] LoadExisting: loading ' + modId);
    var popup = document.getElementById("mcLoadPopup");
    if (popup) popup.remove();
    
    // Get code from localStorage
    var code = localStorage.getItem("farm_mod_code_" + modId);
    var meta = null;
    try { meta = JSON.parse(localStorage.getItem("farm_mod_meta_" + modId)); } catch(e) {}
    
    if (!code) {
      if (typeof notify === "function") notify("❌ 未找到 Mod 代码");
      return;
    }
    
    // Fill the AI panel
    var codeEl = document.getElementById("mcAICode");
    if (codeEl) codeEl.value = code;
    
    var infoEl = document.getElementById("mcAIInfo");
    if (infoEl) {
      var name = (meta && meta.name) || modId;
      var desc = (meta && meta.description) || "";
      infoEl.innerHTML = '<div style="color:#ffcc80;font-weight:bold">' + esc(name) + '</div><div class="tt">' + esc(desc) + '</div>';
    }
    
    var resultEl = document.getElementById("mcAIResult");
    if (resultEl) resultEl.style.display = "block";
    
    var promptEl = document.getElementById("mcAIPrompt");
    var name = (meta && meta.name) || modId;
    if (promptEl && !promptEl.value.trim()) {
      promptEl.value = "改进此Mod: " + name;
    }
    
    if (typeof notify === "function") notify("✅ 已加载: " + name);
  };
window._mcAIUpload = function() {
    if (!currentUser) { if (typeof notify === "function") notify("请先登录"); return; }
    var codeEl = document.getElementById("mcAICode");
    var code = codeEl ? codeEl.value.trim() : "";
    if (!code) { if (typeof notify === "function") notify("没有代码可上传"); return; }
    
    var infoEl = document.getElementById("mcAIInfo");
    var nameEl2 = infoEl ? infoEl.querySelector("div") : null;
    var nameText = nameEl2 ? (nameEl2.textContent || "AI Mod") : "AI Mod";
    var descEl2 = infoEl ? infoEl.querySelector(".tt") : null;
    var descText = descEl2 ? (descEl2.textContent || "") : "";
    var publicEl = document.getElementById("mcAIPublic");
    var isPublic = publicEl ? publicEl.checked : true;
    
    var idMatch = code.match(/modId\s*:\s*["']([^"']+)["']/) || code.match(/id\s*:\s*["']([^"']+)["']/);
    var modId = idMatch ? idMatch[1] : "ai_mod_" + Date.now();
    
    api("/mods", { method: "POST", body: { id: modId, name: nameText, description: descText, version: "1.0", file_content: code, is_public: isPublic } })
      .then(function(d) {
        if (typeof notify === "function") notify("✅ " + d.message);
        var ov = document.getElementById("mcAIOverlay"); if (ov) ov.remove();
        renderModCommunity();
        // 如果是已存在的mod（更新），刷新列表；否则打开上传界面以便版本迭代
        if (d.message.indexOf("更新") === -1) {
          setTimeout(function() {
            if (currentUser) window._mcShowUploadWithCode(modId, nameText, descText, code);
          }, 500);
        }
      })
      .catch(function(e) {
        if (typeof notify === "function") notify("❌ " + e.message);
      });
  };

  // Override upload to include is_public checkbox
  var _mcShowUploadOrig = window._mcShowUpload;
  window._mcShowUploadWithCode = function(id, name, desc, code) {
    if (!currentUser) { if (typeof notify === "function") notify("请先登录"); return; }
    showForm("上传/更新 Mod", [
      {label:"Mod ID", id:"mc_uid", placeholder:"my_cool_mod", value:id},
      {label:"名称", id:"mc_uname", value:name},
      {label:"描述", id:"mc_udesc", value:desc},
      {label:"版本", id:"mc_uver", placeholder:"1.0", value:"1.0"},
      {label:"JS 代码", id:"mc_ucode", type:"textarea", value:code},
      {label:"公开", id:"mc_upublic", type:"checkbox", checked:true}
    ], function(v) {
      api("/mods", {method:"POST", body:{id:v.mc_uid, name:v.mc_uname, description:v.mc_udesc, version:v.mc_uver, file_content:v.mc_ucode, is_public: v.mc_upublic !== false}})
        .then(function(d) { if (typeof notify === "function") notify("✅ " + d.message); renderModCommunity(); document.getElementById("mcFormOverlay").remove(); })
        .catch(function(e) { alert("上传失败: " + e.message); });
    });
  };

  window._mcShowUpload = function() {
    showForm("上传 Mod", [
      {label:"Mod ID (英文)", id:"mc_uid", placeholder:"my_cool_mod"},
      {label:"名称", id:"mc_uname"}, {label:"描述", id:"mc_udesc"},
      {label:"版本", id:"mc_uver", placeholder:"1.0"},
      {label:"JS 代码", id:"mc_ucode", type:"textarea", placeholder:"DataRegistry.register('crop', {...}, {modId: 'xxx'});"},
      {label:"公开", id:"mc_upublic", type:"checkbox", checked:true}
    ], function(v) {
      api("/mods", {method:"POST", body:{id:v.mc_uid, name:v.mc_uname, description:v.mc_udesc, version:v.mc_uver, file_content:v.mc_ucode, is_public: v.mc_upublic !== false}})
        .then(function(d) { if (typeof notify === "function") notify("✅ " + d.message); renderModCommunity(); document.getElementById("mcFormOverlay").remove(); })
        .catch(function(e) { alert("上传失败: " + e.message); });
    });
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

  window._mcLikeMod = function(id) { api('/mods/' + id + '/like', {method:'POST'}).then(function(d) { addLikedMod(id); if (typeof notify === 'function') notify('❤ 已点赞！(' + d.likes + ')'); loadList(); }).catch(function(e) { if (e.message === '你已点赞过此 Mod') { addLikedMod(id); loadList(); if (typeof notify === 'function') notify('❤ 已点赞过'); } else { if (typeof notify === 'function') notify('❌ ' + e.message); } }); };
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
      if (f.type === "textarea") h += '<textarea id="' + f.id + '" placeholder="' + esc(f.placeholder||"") + '" style="width:100%;min-height:120px;background:rgba(0,0,0,.3);border:1px solid #555;border-radius:6px;color:#f0e0c0;padding:8px;font-family:Consolas,monospace;font-size:.82em;resize:vertical">' + esc(f.value||"") + '</textarea>';
      else if(f.type==="checkbox")h+='<input type="checkbox" id="'+f.id+'"'+(f.checked?' checked':'')+' style="width:auto;margin-top:8px"> <label for="'+f.id+'" style="font-size:.9em;color:#aaa">'+esc(f.label)+'</label>';
      else h += '<input type="' + (f.type||"text") + '" id="' + f.id + '" placeholder="' + esc(f.placeholder||"") + '" value="' + esc(f.value||"") + '" style="width:100%;background:rgba(0,0,0,.3);border:1px solid #555;border-radius:6px;color:#f0e0c0;padding:8px;font-size:.9em">';
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
      values[f.id] = el ? (f.type==="checkbox" ? el.checked : el.value) : (f.type==="checkbox" ? false : "");
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

  window._mcShowUploadWithCode = function(id, name, desc, code) {
    if (!currentUser) { if (typeof notify === "function") notify("请先登录"); return; }
    showForm("上传/更新 Mod", [
      {label:"Mod ID", id:"mc_uid", placeholder:"my_cool_mod", value:id},
      {label:"名称", id:"mc_uname", value:name},
      {label:"描述", id:"mc_udesc", value:desc},
      {label:"版本", id:"mc_uver", placeholder:"1.0", value:"1.0"},
      {label:"JS 代码", id:"mc_ucode", type:"textarea", value:code},
      {label:"公开", id:"mc_upublic", type:"checkbox", checked:true}
    ], function(v) {
      api("/mods", {method:"POST", body:{id:v.mc_uid, name:v.mc_uname, description:v.mc_udesc, version:v.mc_uver, file_content:v.mc_ucode, is_public: v.mc_upublic !== false}})
        .then(function(d) { if (typeof notify === "function") notify("✅ " + d.message); renderModCommunity(); document.getElementById("mcFormOverlay").remove(); })
        .catch(function(e) { alert("上传失败: " + e.message); });
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
    var panel = document.createElement("div"); panel.className = "pn"; panel.id = "pmodcom"; (function(){var pn=document.getElementById("pf");return pn?pn.parentNode:document.body;})().appendChild(panel);
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
