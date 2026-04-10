$ErrorActionPreference = "Stop"

function Test-Tool {
  param(
    [string]$Name,
    [string]$Executable,
    [string[]]$Arguments
  )

  try {
    & $Executable @Arguments *> $null
    if ($LASTEXITCODE -ne 0) {
      throw "Exit code $LASTEXITCODE"
    }
    Write-Host "[PASS] $Name"
  } catch {
    Write-Host "[FAIL] $Name"
  }
}

Test-Tool -Name "node" -Executable "node" -Arguments @("-v")
Test-Tool -Name "npm" -Executable "npm.cmd" -Arguments @("-v")
Test-Tool -Name "uv" -Executable "uv" -Arguments @("--version")
Test-Tool -Name "ffmpeg" -Executable "ffmpeg" -Arguments @("-version")
Test-Tool -Name "ffprobe" -Executable "ffprobe" -Arguments @("-version")

try {
  & yt-dlp --version *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] yt-dlp"
  } else {
    throw "Exit code $LASTEXITCODE"
  }
} catch {
  try {
    & uv run --with yt-dlp yt-dlp --version *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "[PASS] yt-dlp (via uv)"
    } else {
      throw "Exit code $LASTEXITCODE"
    }
  } catch {
    Write-Host "[FAIL] yt-dlp"
  }
}

if ($env:MINMAX_API_KEY) {
  Write-Host "[PASS] MINMAX_API_KEY"
} else {
  Write-Host "[FAIL] MINMAX_API_KEY"
}
