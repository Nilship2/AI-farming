$ErrorActionPreference = "Continue"
$farmDir = "C:\farm"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Farm Deploy v2 ===" -ForegroundColor Yellow

Write-Host "[1/4] Stop old service..." -ForegroundColor Cyan
try {
    $proc = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($proc) { $proc | Stop-Process -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped" -ForegroundColor Green; Start-Sleep 2 }
    else { Write-Host "  No running service" -ForegroundColor Gray }
} catch { Write-Host "  Skip" -ForegroundColor Gray }

Write-Host "[2/4] Copy files..." -ForegroundColor Cyan
$files = @{
    ".env" = ""
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
    $destDir = Split-Path $dest
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
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
else { Write-Host "  Some missing, continuing..." -ForegroundColor Yellow }

Write-Host "[4/4] Restart..." -ForegroundColor Cyan
Set-Location $farmDir -ErrorAction SilentlyContinue

Write-Host "  Check Node.js..." -ForegroundColor Gray
$nodeVersion = & node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Node.js not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  Node $nodeVersion" -ForegroundColor Green

Write-Host "  Syntax check..." -ForegroundColor Gray
$syntaxCheck = & node --check server.js 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR in server.js:" -ForegroundColor Red
    Write-Host $syntaxCheck
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  Syntax OK" -ForegroundColor Green

Write-Host "  Starting..." -ForegroundColor Gray
$outLog = $farmDir + "\server-out.log"
$errLog = $farmDir + "\server-err.log"
$proc = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
Start-Sleep 3

if ($proc.HasExited) {
    Write-Host "  FAILED (exit: $($proc.ExitCode))" -ForegroundColor Red
    Write-Host "  --- Error log ---" -ForegroundColor Red
    if (Test-Path $errLog) { Get-Content $errLog | ForEach-Object { Write-Host "  $_" -ForegroundColor Red } }
    if (Test-Path $outLog) { 
        $outContent = Get-Content $outLog
        if ($outContent) { Write-Host "  --- Output ---" -ForegroundColor Yellow; $outContent | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow } }
    }
} else {
    Write-Host "  OK (PID: $($proc.Id))" -ForegroundColor Green
    Write-Host "  Logs: $outLog / $errLog" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Deploy done! Refresh browser." -ForegroundColor Green
Read-Host "Press Enter to exit"