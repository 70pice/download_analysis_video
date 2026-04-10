$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Write-Host "Run frontend in one shell:"
Write-Host "  cd $RepoRoot\frontend; cmd /c npm.cmd run dev"
Write-Host "Run backend in another shell:"
Write-Host "  cd $RepoRoot\backend; uv run --with fastapi --with pydantic --with httpx --with uvicorn[standard] uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Write-Host "Optional frontend API override:"
Write-Host "  `$env:VIDEO_ANALYSIS_API_BASE_URL='http://127.0.0.1:8000'"
