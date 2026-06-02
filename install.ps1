$ErrorActionPreference = "Stop"
$farmDir = "C:\farm"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🌾 农场增量 Mod 社区 v2 部署" -ForegroundColor Yellow

Write-Host "[1/4] 停止旧服务..." -ForegroundColor Cyan
$proc = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" }
if ($proc) { $proc | Stop-Process -Force; Write-Host "  已停止" -ForegroundColor Green; Start-Sleep 2 }
else { Write-Host "  未找到运行中的服务" -ForegroundColor Gray }

Write-Host "[2/4] 复制文件..." -ForegroundColor Cyan
$files = @{
    "db.js" = ""
    "server.js" = ""
    "index.html" = ""
    "patch.js" = ""
    "events.js" = "data\"
    "community-mod-loader.js" = "core\"
    "mod-loader.js" = "core\"
    "engine.js" = "core\"
    "engine-v2.js" = "core\"
    "tech-tree.js" = "core\"
    "debug-panel.js" = "core\"
    "save-slots.js" = "core\"
    "mod-community.js" = "mods\"
}
foreach ($f in $files.Keys) {
    $dest = $farmDir + "\" + $files[$f] + $f
    Copy-Item "$scriptDir\$f" $dest -Force
    Write-Host "  ✓ $f" -ForegroundColor Green
}

Write-Host "[3/4] 验证..." -ForegroundColor Cyan
$allOk = $true
foreach ($f in $files.Keys) {
    $dest = $farmDir + "\" + $files[$f] + $f
    if (-not (Test-Path $dest)) { Write-Host "  ✗ 缺失: $dest" -ForegroundColor Red; $allOk = $false }
}
if (-not $allOk) { Write-Host "验证失败！" -ForegroundColor Red; exit 1 }

Write-Host "[4/4] 重启服务..." -ForegroundColor Cyan
cd $farmDir
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Normal

Write-Host ""
Write-Host "✅ 部署完成！ http://124.221.102.153:3333" -ForegroundColor Green
Write-Host "💡 新功能: 存档位管理 + Mod 待选清单 + 创建新存档" -ForegroundColor Yellow
Read-Host "按 Enter 退出"
