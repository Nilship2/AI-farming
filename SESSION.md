# 农场增量 — 开发会话状态

> 最后更新：2026-06-02 | 阶段：#2 已完成 → #3 准备中

---

## 项目概述

纯前端放置类农场经营游戏。原生 JS，零框架。入口 index.html，引擎 core/engine-v2.js（覆盖 engine.js）。后端 Node.js + SQLite（sql.js），Mod 社区 API。

- 本地开发：C:\农场增量\
- 服务器部署：C:\farm\，端口 3333
- 部署方式：上传 deploy-package\ → 双击 install.bat

---

## 开发路线（5 个方向）

| # | 方向 | 状态 |
|---|------|------|
| 1 | Mod 社区优化（排序/搜索/分页） | ✅ 完成 |
| 2 | AI 模组开发面板（DeepSeek API） | ✅ 完成 |
| 3 | 示例 Mod（用 #2 工具生成验证） | 🔜 下一步 |
| 4 | 概率池机制（加工/农田/畜棚重构） | ⏳ 待定 |
| 5 | 美术优化 | ⏳ 待定 |

---

## #2 已完成改动

### 服务端
- POST /api/ai/generate — 接收 prompt，调用 DeepSeek deepseek-chat，返回 {name, description, code}
- System prompt 内置完整 Mod API 参考（DataRegistry、各类型字段 schema）
- .env 读取：内联解析器，无需 dotenv 包。文件路径 C:\farm\.env，格式 DEEPSEEK_KEY=sk-xxx
- mods 表新增 is_public 字段（默认 1），Migration 安全添加
- GET /api/mods 隐私过滤：未登录只看公开；登录后看公开+自己的私有
- POST /api/mods 上传支持 is_public 参数

### 客户端
- Mod 社区面板新增 🤖 AI 开发 按钮（登录旁）
- AI 面板全屏 Overlay：文本输入 → 生成 → 代码预览 → 复制/保存本地/上传
- "公开"复选框控制上传时的 is_public
- showForm 支持 checkbox 类型字段
- 手动上传表单增加"公开"选项

### 移除
- engine.js — 旧"开发者模式"按钮
- patch.js — 	oggleDevMode 函数和 _devMode 初始化

### 部署注意
- 首次部署需在服务器 C:\farm\.env 添加：DEEPSEEK_KEY=sk-your-key
- 提供了 .env.example 模板

---

## 用户偏好

- 先口头讨论方案，确认后再实施（重要功能）
- 部署只需上传 deploy-package\ 运行 install.bat
- 修改精确，不改无关代码
- 反复点赞允许 | 作物收获仅产出作物不给金币

---

## 关键文件速查

| 文件 | 用途 |
|------|------|
| index.html | 主页面 + 脚本加载 |
| core/engine.js | 原始引擎（bridge + 基础函数） |
| core/engine-v2.js | 实际引擎（覆盖 engine.js 的关键函数） |
| core/registry.js | DataRegistry 数据注册中心 |
| core/tech-tree.js | 科技树渲染 |
| core/debug-panel.js | 三击标题打开的调试面板 |
| core/save-slots.js | 存档位管理 |
| core/mod-loader.js | Mod 启用/禁用 |
| core/community-mod-loader.js | 社区 Mod 按槽位加载 |
| patch.js | 功能增强补丁 |
| data/events.js | 事件定义（18 个） |
| data/research.js | 研究项目定义（10 个） |
| data/research_upgrades.js | 研究解锁的升级 |
| mods/mod-community.js | Mod 社区面板 + AI 开发面板 |
| server.js | Express API（含 Mod + AI + 认证） |
| db.js | SQLite 数据库 |
| deploy-package/ | 部署文件（含 install.bat + .env.example） |
| outputs/MOD_REFERENCE.md | Mod 开发参考文档 |