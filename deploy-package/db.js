const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "farm_community.db");
let db = null;
let ready = false;

async function initDB() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, "node_modules", "sql.js", "dist", file),
  });
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run("CREATE TABLE IF NOT EXISTS mods (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', author TEXT DEFAULT '匿名', version TEXT DEFAULT '1.0', file_content TEXT NOT NULL, downloads INTEGER DEFAULT 0, likes INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now','localtime')), updated_at TEXT DEFAULT (datetime('now','localtime')))");
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, is_admin INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now','localtime')))");
  ready = true;
  console.log("[DB] 数据库初始化完成");
  saveDB();
}

function saveDB() {
  if (!db) return;
  try { const data = db.export(); fs.writeFileSync(DB_PATH, Buffer.from(data)); } catch (e) { console.error("[DB] 保存失败:", e.message); }
}
setInterval(() => { if (ready) saveDB(); }, 60000);

function run(sql, params = []) { if (!ready) throw new Error("数据库未就绪"); db.run(sql, params); saveDB(); }
function get(sql, params = []) { if (!ready) throw new Error("数据库未就绪"); const stmt = db.prepare(sql); stmt.bind(params); if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row; } stmt.free(); return null; }
function all(sql, params = []) { if (!ready) throw new Error("数据库未就绪"); const results = []; const stmt = db.prepare(sql); stmt.bind(params); while (stmt.step()) { results.push(stmt.getAsObject()); } stmt.free(); return results; }

module.exports = { initDB, run, get, all, saveDB, isReady: () => ready };
