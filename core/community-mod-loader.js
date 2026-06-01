// ============================================================
// 社区 Mod 加载器 v2 — 按存档槽位加载 Mod
// 读取当前槽位的存档 → 提取 _mods → 仅加载清单中的 Mod
// ============================================================
(function() {
  // 1. 获取当前槽位
  var slot = 0;
  try { slot = parseInt(localStorage.getItem("farm_current_slot") || "0"); } catch(e) {}
  if (isNaN(slot) || slot < 0 || slot > 4) slot = 0;

  // 2. 读取该槽位的存档，提取 _mods
  var modIds = [];
  try {
    var raw = localStorage.getItem("farm_save_slot_" + slot);
    if (raw) {
      var save = JSON.parse(raw);
      if (Array.isArray(save._mods)) modIds = save._mods;
    }
  } catch(e) {}

  // 3. 如果存档没有 _mods，检查是否有待创建的新存档 Mod（双重来源）
  if (modIds.length === 0) {
    try {
      var pendingRaw = localStorage.getItem("farm_new_save_mods");
      if (!pendingRaw) pendingRaw = sessionStorage.getItem("farm_new_save_mods_backup");
      if (pendingRaw) {
        modIds = JSON.parse(pendingRaw);
        localStorage.removeItem("farm_new_save_mods");
        try { sessionStorage.removeItem("farm_new_save_mods_backup"); } catch(e) {}
      }
    } catch(e) { console.warn("[CommunityMod] 读取待创建 Mod 失败:", e); }
  }
  if (modIds.length === 0) {
    window.__enabledMods = [];
    DataRegistry.setEnabledMods([]);
    return;
  }

  // 4. 确保 manifest 中存在这些 Mod
  if (!window.__modManifest) window.__modManifest = [];

  for (var i = 0; i < modIds.length; i++) {
    var modId = modIds[i];
    var code = localStorage.getItem("farm_mod_code_" + modId);
    var meta = null;
    try { meta = JSON.parse(localStorage.getItem("farm_mod_meta_" + modId) || "null"); } catch(e) {}

    if (!code) continue; // 代码缺失则跳过

    // 检查是否已在 manifest 中
    var inManifest = false;
    for (var j = 0; j < window.__modManifest.length; j++) {
      if (window.__modManifest[j].id === modId) { inManifest = true; break; }
    }

    if (!inManifest) {
      window.__modManifest.push({
        id: modId,
        name: (meta && meta.name) || modId,
        file: "(community)",
        desc: (meta && meta.description) || "社区 Mod",
        version: (meta && meta.version) || "1.0",
        community: true
      });
    }

    // 注入 Mod 代码
    try {
      var scriptEl = document.createElement("script");
      scriptEl.textContent = code;
      scriptEl.setAttribute("data-mod-id", modId);
      scriptEl.setAttribute("data-community", "true");
      document.head.appendChild(scriptEl);
    } catch (e) {
      console.warn("[CommunityMod] 加载 '" + modId + "' 失败:", e.message);
    }
  }

  // 5. 设置启用的 Mod（仅存档中的）
  DataRegistry.setEnabledMods(modIds);
  window.__enabledMods = modIds;

  console.log("[CommunityMod] 槽位 " + slot + ", Mods:", modIds);
})();
