# One-click push to https://github.com/vishal360/bot-and-a-dream.git
# Run: Right-click -> Run with PowerShell, or in VS Code terminal: powershell -ExecutionPolicy Bypass -File .\PUSH_TO_GITHUB.ps1
$ErrorActionPreference = "Stop"
$repo = "https://github.com/vishal360/bot-and-a-dream.git"
$work = "c:\a bot and a dream"
Set-Location $work

# Check git
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  $candidates = @("C:\Program Files\Git\cmd\git.exe","C:\Program Files\Git\bin\git.exe","C:\Program Files (x86)\Git\cmd\git.exe")
  foreach($c in $candidates){ if(Test-Path $c){ Set-Alias git $c -Scope Global; $git = Get-Command git -ErrorAction SilentlyContinue; break } }
}
if (-not $git) {
  Write-Host "Git not found. Installing via winget..."
  try { winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements } catch { Write-Host "winget failed, download from https://git-scm.com/download/win" -ForegroundColor Yellow }
  $env:Path += ";C:\Program Files\Git\cmd"
  $git = Get-Command git -ErrorAction SilentlyContinue
}
if (-not $git) { throw "Git still not found. Install manually from https://git-scm.com/download/win then re-run this script." }

Write-Host "Using git: $($git.Source)" -ForegroundColor Green
git --version

# Safety: never commit .env
if ((Get-Content .gitignore -ErrorAction SilentlyContinue) -notmatch "^\.env$") { Add-Content .gitignore "`n.env" }

# Verify .env.example is sanitized
$ex = Get-Content .env.example -Raw -ErrorAction SilentlyContinue
if ($ex -match "acffcd4c") { Write-Host "ERROR: .env.example still contains real key! Sanitizing now..." -ForegroundColor Red; (Get-Content .env.example) -replace "acffcd4c.*","your_lighter_api_key_here" | Set-Content .env.example }

if (-not (Test-Path ".git")) { git init }
git add -A
# show what will be committed (should NOT include .env)
Write-Host "`nStaged files (should NOT show .env):" -ForegroundColor Cyan
git status --short
Write-Host "`nIf you see .env above, abort! Check .gitignore" -ForegroundColor Yellow
git config user.name "bot-terminal" 2>$null
git config user.email "bot@local" 2>$null
try { git commit -m "feat: hedge-fund bot terminal V1 — Lighter testnet, TCA, Lab, Backtest, Risk+Kill" } catch { Write-Host "Nothing to commit or commit failed: $_" }

$hasOrigin = git remote 2>$null | Select-String "origin"
if (-not $hasOrigin) { git remote add origin $repo } else { git remote set-url origin $repo }

git branch -M main
# If repo already has commits, rebase
try { git pull --rebase origin main --allow-unrelated-histories 2>$null } catch {}
Write-Host "`nPushing to $repo ..." -ForegroundColor Green
git push -u origin main
Write-Host "`nDone! Visit https://github.com/vishal360/bot-and-a-dream" -ForegroundColor Green
