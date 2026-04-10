# Verification

## Script Entry Point

Use `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`.

## Current Split Verification Flow

`scripts/verify.ps1` runs:

- `cmd /c npm.cmd test -- --run` in `frontend/`
- `cmd /c npx.cmd tsc --noEmit` in `frontend/`
- `cmd /c npm.cmd run build` in `frontend/`
- `uv run --with pytest --with fastapi --with pydantic --with httpx pytest -q` in `backend/`

## Local Dev Defaults

- Frontend calls `http://127.0.0.1:8000` by default for the backend API.
- Override with `VIDEO_ANALYSIS_API_BASE_URL` if the backend runs elsewhere.
