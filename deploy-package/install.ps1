$ErrorActionPreference = "Continue"
$farmDir = "C:\farm"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[Farm] Deploy v2" -ForegroundColor Yellow

Write-Host "[1/4] Stop old service..." -ForegroundColor Cyan
try {
    $proc = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($proc) { $proc | Stop-Process -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped" -ForegroundColor Green; Start-Sleep 2 }
    else { Write-Host "  No running service" -ForegroundColor Gray }
} catch { Write-Host "  Skip process check" -ForegroundColor Gray }

Write-Host "[2/4] Copy files..." -ForegroundColor Cyan
$files = @{
    "db.js" = ""
    "server.js" = ""
    "index.html" = ""
    "patch.js" = ""
    "events.js" = "data\"
    "research.js" = "data\"
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
    $src = $scriptDir + "\" + $f
    $dest = $farmDir + "\" + $files[$f] + $f
    if (Test-Path $src) {
        Copy-Item $src $dest -Force -ErrorAction SilentlyContinue
        Write-Host "  OK $f" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $src" -ForegroundColor Red
    }
}

Write-Host "[3/4] Verify..." -ForegroundColor Cyan
$allOk = $true
foreach ($f in $files.Keys) {
    $dest = $farmDir + "\" + $files[$f] + $f
    if (-not (Test-Path $dest)) { Write-Host "  MISSING: $dest" -ForegroundColor Red; $allOk = $false }
}
if ($allOk) { Write-Host "  All OK" -ForegroundColor Green }
else { Write-Host "  Some files missing, continue..." -ForegroundColor Yellow }

Write-Host "[4/4] Restart service..." -ForegroundColor Cyan
Set-Location $farmDir -ErrorAction SilentlyContinue
try {
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Normal -ErrorAction Stop
    Write-Host ""
    Write-Host "Deploy done!" -ForegroundColor Green
} catch {
    Write-Host "Start failed: $_" -ForegroundColor Red
    Write-Host "Check Node.js and C:\farm\server.js" -ForegroundColor Yellow
}
Write-Host "Refresh browser to apply changes" -ForegroundColor Yellow
Read-Host "Press Enter to exit"