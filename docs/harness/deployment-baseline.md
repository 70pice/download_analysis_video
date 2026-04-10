# Deployment Baseline

## Current State

The current repo runs as a Next.js app.

## Target State

- `frontend/` for Next.js
- `backend/` for FastAPI
- required local runtime: `uv`, `ffmpeg`, and `ffprobe`
- `yt-dlp` can be installed globally or invoked through `uv`
- MinMax API for clip understanding

## First-Phase Product Constraints

- single-user admin console
- URL input only
- local download and slicing
- cloud clip analysis through MinMax
