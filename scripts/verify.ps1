$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-NativeCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

Write-Host "Frontend:"
Set-Location (Join-Path $RepoRoot "frontend")
Invoke-NativeCommand -FilePath "cmd" -Arguments @("/c", "npm.cmd", "test", "--", "--run")
Invoke-NativeCommand -FilePath "cmd" -Arguments @("/c", "npx.cmd", "tsc", "--noEmit")
Invoke-NativeCommand -FilePath "cmd" -Arguments @("/c", "npm.cmd", "run", "build")

Write-Host "Backend:"
Set-Location (Join-Path $RepoRoot "backend")
Invoke-NativeCommand -FilePath "uv" -Arguments @(
  "run",
  "--with",
  "pytest",
  "--with",
  "fastapi",
  "--with",
  "pydantic",
  "--with",
  "httpx",
  "pytest",
  "-q"
)
