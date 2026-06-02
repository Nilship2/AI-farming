const express = require("express");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { initDB, run, get, all, saveDB, isReady } = require("./db");

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

  // 搜索条件
  let whereClause = "";
  const params = [];
  if (search) {
    whereClause = "WHERE name LIKE ? OR description LIKE ?";
    params.push("%" + search + "%", "%" + search + "%");
  }

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
  if (get("SELECT id FROM mods WHERE id = ?", [id])) return res.status(409).json({ error: "Mod ID 已存在" });
  run("INSERT INTO mods (id, name, description, author, version, file_content) VALUES (?, ?, ?, ?, ?, ?)", [id, name, description || "", req.user.username, version || "1.0", file_content]);
  res.status(201).json({ message: "Mod 上传成功！", id });
});

// 删除
app.delete("/api/mods/:id", authRequired, (req, res) => {
  const mod = get("SELECT * FROM mods WHERE id = ?", [req.params.id]);
  if (!mod) return res.status(404).json({ error: "Mod 不存在" });
  const user = get("SELECT is_admin FROM users WHERE id = ?", [req.user.id]);
  if (mod.author !== req.user.username && !user?.is_admin) return res.status(403).json({ error: "只能删除自己的 Mod" });
  run("DELETE FROM mods WHERE id = ?", [req.params.id]); saveDB();
  res.json({ message: "Mod 已删除" });
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
