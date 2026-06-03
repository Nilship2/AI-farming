const express = require("express");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { initDB, run, get, all, saveDB, isReady } = require("./db");
// Read .env file manually
(function() {
  const envPath = "C:\\farm\\.env";
  try {
    if (require("fs").existsSync(envPath)) {
      const content = require("fs").readFileSync(envPath, "utf8");
      console.log("[ENV] .env found, " + content.split(/\\r?\\n/).length + " lines");
      content.split(/\\r?\\n/).forEach(function(line) {
        line = line.trim();
        if (!line || line[0] === "#") return;
        const eqIdx = line.indexOf("=");
        if (eqIdx > 0) {
          const key = line.substring(0, eqIdx).trim();
          let val = line.substring(eqIdx + 1).trim();
          if (val.length > 1) { var c0 = val.charCodeAt(0); var ce = val.charCodeAt(val.length-1); if (c0 === ce && (c0 === 34 || c0 === 39)) val = val.substring(1, val.length-1); }
          process.env[key] = val;
          console.log("[ENV] Loaded: " + key + "=" + val.substring(0,10) + "...");
        }
      });
    } else { console.log("[ENV] .env not found at " + envPath); }
  } catch(e) { console.log("[ENV] Error reading .env: " + e.message); }
})();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "farm_mod_community_secret_2026";
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

// 鉴权中间件
function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "请先登录" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "登录已过期，请重新登录" }); }
}

// ======== 认证 ========
app.post("/api/auth/register", async (req, res) => {
  console.log("[REGISTER] body:", JSON.stringify(req.body));
  const { username, password } = req.body;
  if (!username || !password) { console.log("[REGISTER] missing fields"); return res.status(400).json({ error: "用户名和密码不能为空" }); }
  if (username.length < 2 || username.length > 20) { console.log("[REGISTER] bad username length"); return res.status(400).json({ error: "用户名2-20个字符" }); }
  if (password.length < 4) { console.log("[REGISTER] bad password length"); return res.status(400).json({ error: "密码至少4个字符" }); }
  const existing = get("SELECT id FROM users WHERE username = ?", [username]);
  console.log("[REGISTER] existing check:", JSON.stringify(existing));
  if (existing) { console.log("[REGISTER] username taken"); return res.status(409).json({ error: "用户名已被注册" }); }
  console.log("[REGISTER] hashing password...");
  const hash = await bcrypt.hash(password, 10);
  console.log("[REGISTER] hash done, inserting...");
  run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, hash]);
  const user = get("SELECT id, username, password_hash FROM users WHERE username = ?", [username]);
  console.log("[REGISTER] inserted user:", JSON.stringify(user));
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, username: user.username } });
  console.log("[REGISTER] response sent");
});

app.post("/api/auth/login", async (req, res) => { console.log("[LOGIN] body:", JSON.stringify(req.body));
  const { username, password } = req.body;
  const user = get("SELECT * FROM users WHERE username = ?", [username]); console.log("[LOGIN] user row:", JSON.stringify(user));
  if (!user) return res.status(401).json({ error: "用户名或密码错误" });
  if (!(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "用户名或密码错误" });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// ======== Mod 列表（分页 + 排序 + 搜索）========
app.get("/api/mods", (req, res) => {
  const search = (req.query.search || "").trim();
  const sort = req.query.sort || "downloads";
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(req.query.pageSize) || 10));

  // 排序字段白名单
  const sortMap = {
    downloads: "downloads DESC",
    likes: "likes DESC",
    updated: "updated_at DESC"
  };
  const orderBy = sortMap[sort] || "downloads DESC";

  // Build WHERE with search + privacy
  let conditions = [];
  const params = [];
  if (search) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    params.push("%" + search + "%", "%" + search + "%");
  }
  // Privacy: show public mods OR user's own private mods
  const token = req.headers.authorization?.replace("Bearer ", "");
  let userId = null;
  if (token) { try { userId = jwt.verify(token, JWT_SECRET).id; } catch(e) {} }
  if (userId) {
    const user = get("SELECT username FROM users WHERE id = ?", [userId]);
    const username = user ? user.username : "";
    conditions.push("(is_public = 1 OR author = ?)");
    params.push(username);
  } else {
    conditions.push("is_public = 1");
  }
  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  // 总数
  const countRow = get("SELECT COUNT(*) as cnt FROM mods " + whereClause, params);
  const total = countRow ? countRow.cnt : 0;
  const totalPages = Math.ceil(total / pageSize);

  // 分页查询
  const offset = (page - 1) * pageSize;
  const mods = all(
    "SELECT id, name, description, author, version, downloads, likes, created_at, updated_at FROM mods " + whereClause + " ORDER BY " + orderBy + " LIMIT ? OFFSET ?",
    params.concat([pageSize, offset])
  );

  res.json({ mods, total, page, pageSize, totalPages });
});
// Mod 详情
app.get("/api/mods/:id", (req, res) => {
  const mod = get("SELECT id, name, description, author, version, downloads, likes, created_at, updated_at FROM mods WHERE id = ?", [req.params.id]);
  if (!mod) return res.status(404).json({ error: "Mod 不存在" });
  res.json({ mod });
});

// 下载 Mod（含代码）
app.get("/api/mods/:id/download", (req, res) => {
  const mod = get("SELECT * FROM mods WHERE id = ?", [req.params.id]);
  if (!mod) return res.status(404).json({ error: "Mod 不存在" });
  run("UPDATE mods SET downloads = downloads + 1 WHERE id = ?", [req.params.id]); saveDB();
  res.json({ id: mod.id, name: mod.name, version: mod.version, author: mod.author, description: mod.description, file_content: mod.file_content });
});

// 点赞（IP 去重：同一 IP 对同一 Mod 只能点一次赞）
app.post("/api/mods/:id/like", (req, res) => {
  const modId = req.params.id;
  if (!get("SELECT id FROM mods WHERE id = ?", [modId])) return res.status(404).json({ error: "Mod 不存在" });
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  if (get("SELECT ip FROM mod_likes WHERE ip = ? AND mod_id = ?", [ip, modId])) {
    return res.status(409).json({ error: "你已点赞过此 Mod" });
  }
  run("INSERT INTO mod_likes (ip, mod_id) VALUES (?, ?)", [ip, modId]);
  run("UPDATE mods SET likes = likes + 1 WHERE id = ?", [modId]);
  const likes = get("SELECT likes FROM mods WHERE id = ?", [modId]).likes;
  res.json({ likes });
});

// 上传
app.post("/api/mods", authRequired, (req, res) => {
  const { id, name, description, version, file_content } = req.body;
  if (!id || !name || !file_content) return res.status(400).json({ error: "缺少必填字段 (id, name, file_content)" });
  if (!/^[a-zA-Z0-9_]+$/.test(id)) return res.status(400).json({ error: "Mod ID 只能包含字母、数字和下划线" });
  const existing = get("SELECT id, author FROM mods WHERE id = ?", [id]);
  if (existing) {
    if (existing.author !== req.user.username) return res.status(409).json({ error: "Mod ID 已被其他用户占用" });
    // Update existing mod
    const isPublic2 = req.body.is_public !== false ? 1 : 0;
    run("UPDATE mods SET name=?, description=?, version=?, file_content=?, is_public=?, updated_at=datetime(\"now\",\"localtime\") WHERE id=?", [name, description||"", version||"1.0", file_content, isPublic2, id]);
    saveDB();
    return res.json({ message: "Mod 已更新！", id });
  }
  const isPublic = req.body.is_public !== false ? 1 : 0;
  run("INSERT INTO mods (id, name, description, author, version, file_content, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, name, description || "", req.user.username, version || "1.0", file_content, isPublic]);
  res.status(201).json({ message: "Mod 上传成功！", id });
});

// 更新 Mod
app.put("/api/mods/:id", authRequired, (req, res) => {
  const mod = get("SELECT * FROM mods WHERE id = ?", [req.params.id]);
  if (!mod) return res.status(404).json({ error: "Mod 不存在" });
  if (mod.author !== req.user.username) return res.status(403).json({ error: "只能更新自己的 Mod" });
  const { name, description, version, file_content, is_public } = req.body;
  const updates = [];
  const vals = [];
  if (name !== undefined) { updates.push("name = ?"); vals.push(name); }
  if (description !== undefined) { updates.push("description = ?"); vals.push(description); }
  if (version !== undefined) { updates.push("version = ?"); vals.push(version); }
  if (file_content !== undefined) { updates.push("file_content = ?"); vals.push(file_content); }
  if (is_public !== undefined) { updates.push("is_public = ?"); vals.push(is_public !== false ? 1 : 0); }
  updates.push("updated_at = datetime('now','localtime')");
  vals.push(req.params.id);
  run("UPDATE mods SET " + updates.join(", ") + " WHERE id = ?", vals);
  saveDB();
  res.json({ message: "Mod 已更新", id: req.params.id });
});

// 删除 Mod
app.delete("/api/mods/:id", authRequired, (req, res) => {
  const mod = get("SELECT * FROM mods WHERE id = ?", [req.params.id]);
  if (!mod) return res.status(404).json({ error: "Mod 不存在" });
  const user = get("SELECT is_admin FROM users WHERE id = ?", [req.user.id]);
  if (mod.author !== req.user.username && !user?.is_admin) return res.status(403).json({ error: "只能删除自己的 Mod" });
  run("DELETE FROM mods WHERE id = ?", [req.params.id]); saveDB();
  res.json({ message: "Mod 已删除" });
});


// ======== AI 模组生成 ========
const MOD_SYSTEM_PROMPT = "你是一个农场增量游戏的 Mod 生成器。根据用户的自然语言描述，生成有效的 JavaScript Mod 代码。\n\n" +
  "## 游戏 Mod API\n\n" +
  "所有内容通过 DataRegistry 注册，不要直接修改全局变量。\n\n" +
  "### 注册方法\n" +
  "DataRegistry.register(category, definition, {modId: \"your_mod_id\"})\n" +
  "category: crop, hybrid, animal, processor, upgrade, achievement, event, relic, gemUpgrade, research, story\n\n" +
  "### 作物 crop\n" +
  "{id:\"crop_id\", n:\"名称\", i:\"图标emoji\", g:生长秒数, v:基础价值, unlock:解锁金币, harvestCount:收获数量(默认2), soil:\"土壤类型\", season:\"季节\"}\n\n" +
  "### 杂交品种 hybrid\n" +
  "{id:\"hybrid_id\", n:\"名称\", i:\"图标\", g:生长秒数, v:价值, p:[\"父本id\",\"母本id\"], ch:概率(0-1), unlock:解锁金币}\n\n" +
  "### 动物 animal\n" +
  "{id:\"animal_id\", n:\"名称\", i:\"图标\", c:购买成本, unlock:解锁金币, g:成长秒数, p:{n:\"产物名\",k:\"产物资源键\",v:产物价值}}\n\n" +
  "### 加工厂 processor\n" +
  "{id:\"processor_id\", n:\"名称\", i:\"图标\", c:建造成本, unlock:解锁金币, g:加工秒数, inp:{k:\"输入资源键\",n:\"输入名\",q:消耗数量}, out:{k:\"输出资源键\",n:\"输出名\",q:产出数量,v:产物价值}}\n\n" +
  "### 升级 upgrade\n" +
  "{id:\"upgrade_id\", n:\"名称\", i:\"图标\", d:\"描述\", c:金币成本, unlock:解锁条件, ef:\"效果类型\", v:效果数值}\n" +
  "效果类型: grow(生长速度), coin(金币加成), harvestPlus(收获量), hybridChance(杂交概率), animalAff(动物好感), animalOutput(动物产出), greenhouseBonus(温室加成), stormResist(暴风雨抵抗), water(浇水)\n\n" +
  "### 事件 event\n" +
  "{id:\"event_id\", n:\"名称\", i:\"图标\", d:\"描述\", ef:function(){ /* GS全局状态 */ }}\n\n" +
  "### 成就 achievement\n" +
  "{id:\"ach_id\", n:\"名称\", d:\"描述\", t:星级(1-5), check:function(gs){return true/false;}}\n\n" +
  "### 遗物 relic\n" +
  "{id:\"relic_id\", n:\"名称\", i:\"图标\", d:\"描述\", ef:\"效果类型\", v:效果数值}\n\n" +
  "## 重要规则\n" +
  "1. 唯一 modId（英文+数字+下划线）\n" +
  "2. ID 用英文命名\n" +
  "3. 只用 DataRegistry，不改全局变量\n" +
  "4. 代码格式：自执行函数或 DataRegistry.register\n" +
  "5. 只输出 JavaScript，不含 HTML/CSS\n\n" +
  "## 输出格式\n" +
  "只返回 JSON: {\"name\":\"Mod 名称\",\"description\":\"简短描述\",\"code\":\"完整的 JS 代码\"}";


const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || process.env["DEEPSEEK_KEY"] || "";
console.log("[AI] DEEPSEEK_KEY " + (DEEPSEEK_KEY ? "configured (len=" + DEEPSEEK_KEY.length + ")" : "MISSING"));
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

app.post("/api/ai/generate", async (req, res) => {
  if (!DEEPSEEK_KEY) return res.status(503).json({ error: "AI 服务未配置（缺少 DEEPSEEK_KEY）" });
  const { prompt } = req.body;
  if (!prompt || prompt.trim().length < 5) return res.status(400).json({ error: "请提供至少5个字的描述" });

  try {
    const https = require("https");
    const body = JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: MOD_SYSTEM_PROMPT },
        { role: "user", content: "请为以下描述生成 Mod 代码：\n" + prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    });

    const data = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: "api.deepseek.com",
        path: "/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + DEEPSEEK_KEY
        }
      }, (resp) => {
        let body2 = "";
        resp.on("data", (chunk) => body2 += chunk);
        resp.on("end", () => {
          try {
            const json = JSON.parse(body2);
            if (resp.statusCode >= 400) reject(new Error(json.error?.message || "DeepSeek API error " + resp.statusCode));
            else resolve(json);
          } catch(e) { reject(new Error("Invalid JSON response")); }
        });
      });
      req2.on("error", reject);
      req2.write(body);
      req2.end();
    });

    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*"name"[\s\S]*"code"[\s\S]*\}/);
    if (jsonMatch) {
      try { return res.json(JSON.parse(jsonMatch[0])); } catch(e) {}
    }
    
    const codeMatch = content.match(/`(?:javascript|js)?\s*([\s\S]*?)`/);
    const code = codeMatch ? codeMatch[1].trim() : content;
    const nameMatch = content.match(/"name"\s*:\s*"([^"]+)"/);
    const descMatch = content.match(/"description"\s*:\s*"([^"]+)"/);
    
    res.json({
      name: nameMatch ? nameMatch[1] : "AI 生成的 Mod",
      description: descMatch ? descMatch[1] : "由 AI 自动生成",
      code: code
    });
  } catch(e) {
    console.error("[AI] 生成失败:", e.message);
    res.status(500).json({ error: "AI 生成失败: " + e.message });
  }
});
// ======== 静态页面 ========
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// ======== 启动 ========
async function start() {
  await initDB();
  var adminRow = get("SELECT COUNT(*) as cnt FROM users WHERE is_admin = 1"); if (!adminRow || adminRow.cnt === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    run("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)", ["admin", hash]);
    console.log("[DB] 默认管理员: admin / admin123");
  }
  app.listen(PORT, () => {
    console.log("🌾 农场增量已上线 http://124.221.102.153:" + PORT);
    console.log("📦 Mod 社区 API 就绪");
  });
}
start().catch(err => { console.error("启动失败:", err); process.exit(1); });
