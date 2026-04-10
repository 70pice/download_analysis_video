# Video Analysis Harness Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current repository into a standard development harness by adding a short repo map, stable harness docs, and reusable setup and verification scripts.

**Architecture:** Keep the current Next.js application intact while adding a repo-level harness layer around it. The implementation centers on a short root `AGENTS.md`, stable docs under `docs/`, PowerShell scripts under `scripts/`, and README updates that teach both humans and agents how to navigate and verify the repo.

**Tech Stack:** Markdown documentation, PowerShell scripts, Node.js, npm, TypeScript, Next.js, Vitest

---

### Task 1: Add The Root Agent Map

**Files:**
- Create: `AGENTS.md`
- Modify: `README.md`
- Test: `README.md`

- [ ] **Step 1: Write the failing documentation check**

```powershell
Test-Path AGENTS.md
```

Expected: `False`

- [ ] **Step 2: Run the check to verify it fails**

Run: `Test-Path AGENTS.md`
Expected: `False`

- [ ] **Step 3: Write minimal implementation**

Create `AGENTS.md` with a short, navigation-only structure:

```md
# Repo Guide

## Purpose

This repository contains a video download and analysis product that is being evolved from a Next.js prototype into a front-end and back-end separated web system.

## Key Paths

- `src/`: current application code
- `data/`: current local artifacts
- `docs/harness/`: repo workflow and verification docs
- `docs/architecture/`: stable system design docs
- `docs/product/`: scope and product constraints
- `docs/superpowers/specs/`: approved design docs
- `docs/superpowers/plans/`: approved implementation plans
- `scripts/`: local setup and verification commands

## Read First

1. `README.md`
2. `docs/harness/repo-map.md`
3. `docs/architecture/video-analysis-system.md`
4. the most recent relevant file in `docs/superpowers/specs/`
5. the matching file in `docs/superpowers/plans/`

## Verify Before Completion

- `powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`

## Documentation Rules

- Update docs when repo structure, interfaces, or workflows change.
- Keep this file short and use linked docs for long explanations.
```

Update the top of `README.md` so it mentions that the repo now follows a harness workflow and points readers to `AGENTS.md`.

- [ ] **Step 4: Run the check to verify it passes**

Run: `Test-Path AGENTS.md`
Expected: `True`

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: add root harness agent map"
```

### Task 2: Add Stable Harness Documentation

**Files:**
- Create: `docs/harness/repo-map.md`
- Create: `docs/harness/development-workflow.md`
- Create: `docs/harness/verification.md`
- Create: `docs/harness/deployment-baseline.md`
- Create: `docs/architecture/video-analysis-system.md`
- Create: `docs/product/web-app-scope.md`

- [ ] **Step 1: Write the failing file checks**

```powershell
@(
  'docs/harness/repo-map.md',
  'docs/harness/development-workflow.md',
  'docs/harness/verification.md',
  'docs/harness/deployment-baseline.md',
  'docs/architecture/video-analysis-system.md',
  'docs/product/web-app-scope.md'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 2: Run the checks to verify they fail**

Run:

```powershell
@(
  'docs/harness/repo-map.md',
  'docs/harness/development-workflow.md',
  'docs/harness/verification.md',
  'docs/harness/deployment-baseline.md',
  'docs/architecture/video-analysis-system.md',
  'docs/product/web-app-scope.md'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 3: Write minimal implementation**

Create the docs with focused responsibilities:

`docs/harness/repo-map.md`

```md
# Repo Map

## Current Runtime Paths

- `src/`: current Next.js application, route handlers, contracts, and tests
- `data/`: current pipeline artifacts
- `tools/`: auxiliary local tooling

## Harness Paths

- `docs/harness/`: repo workflow and verification guidance
- `docs/architecture/`: stable system design
- `docs/product/`: user-facing scope and constraints
- `docs/superpowers/specs/`: approved design docs
- `docs/superpowers/plans/`: approved execution plans
- `scripts/`: setup, doctor, dev, and verification entry points

## Planned Product Split

- `frontend/`: future Next.js UI
- `backend/`: future FastAPI service
- `storage/`: future local runtime artifacts
```

`docs/harness/development-workflow.md`

```md
# Development Workflow

1. Write or update a spec before meaningful product or structural work.
2. Approve the spec.
3. Write a plan in `docs/superpowers/plans/`.
4. Implement in small steps.
5. Run `scripts/verify.ps1`.
6. Update docs and examples when behavior changes.
```

`docs/harness/verification.md`

```md
# Verification

## Required Checks For The Current Repo

- `cmd /c npm.cmd test -- --run`
- `cmd /c npx.cmd tsc --noEmit`
- `cmd /c npm.cmd run build`

## Script Entry Point

Use `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`.
```

`docs/harness/deployment-baseline.md`

```md
# Deployment Baseline

## Current State

The current repo runs as a Next.js app.

## Target State

- `frontend/` for Next.js
- `backend/` for FastAPI
- local server binaries for `yt-dlp` and `ffmpeg`
- MinMax API for clip understanding

## First-Phase Product Constraints

- single-user admin console
- URL input only
- local download and slicing
- cloud clip analysis through MinMax
```

`docs/architecture/video-analysis-system.md`

```md
# Video Analysis System

## Current Architecture

The current system is a Next.js app with in-process route handlers and a staged artifact pipeline.

## Target Architecture

- Next.js front end
- FastAPI back end
- local artifact storage
- staged analysis pipeline with explicit task states
```

`docs/product/web-app-scope.md`

```md
# Web App Scope

## Phase 1

- single-user web admin
- submit one video URL
- download video locally
- split video locally
- analyze clips with MinMax API
- produce clip analysis, storyboard, and remix plan

## Not In Phase 1

- authentication
- multi-user support
- direct local model inference
- batch upload
```

- [ ] **Step 4: Run the checks to verify they pass**

Run:

```powershell
@(
  'docs/harness/repo-map.md',
  'docs/harness/development-workflow.md',
  'docs/harness/verification.md',
  'docs/harness/deployment-baseline.md',
  'docs/architecture/video-analysis-system.md',
  'docs/product/web-app-scope.md'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `True`

- [ ] **Step 5: Commit**

```bash
git add docs/harness/repo-map.md docs/harness/development-workflow.md docs/harness/verification.md docs/harness/deployment-baseline.md docs/architecture/video-analysis-system.md docs/product/web-app-scope.md
git commit -m "docs: add harness, architecture, and product docs"
```

### Task 3: Add Environment And Verification Scripts

**Files:**
- Create: `scripts/doctor.ps1`
- Create: `scripts/verify.ps1`
- Create: `scripts/dev.ps1`
- Create: `scripts/bootstrap.ps1`

- [ ] **Step 1: Write the failing file checks**

```powershell
@(
  'scripts/doctor.ps1',
  'scripts/verify.ps1',
  'scripts/dev.ps1',
  'scripts/bootstrap.ps1'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 2: Run the checks to verify they fail**

Run:

```powershell
@(
  'scripts/doctor.ps1',
  'scripts/verify.ps1',
  'scripts/dev.ps1',
  'scripts/bootstrap.ps1'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 3: Write minimal implementation**

Create `scripts/doctor.ps1`:

```powershell
$ErrorActionPreference = "Stop"

$checks = @(
  @{ Name = "node"; Command = "node -v" },
  @{ Name = "npm"; Command = "npm -v" },
  @{ Name = "python"; Command = "python --version" },
  @{ Name = "pip"; Command = "pip --version" },
  @{ Name = "ffmpeg"; Command = "ffmpeg -version" },
  @{ Name = "ffprobe"; Command = "ffprobe -version" },
  @{ Name = "yt-dlp"; Command = "yt-dlp --version" }
)

foreach ($check in $checks) {
  try {
    Write-Host "[PASS] $($check.Name)"
    Invoke-Expression $check.Command | Select-Object -First 1
  } catch {
    Write-Host "[FAIL] $($check.Name)"
  }
}

if ($env:MINMAX_API_KEY) {
  Write-Host "[PASS] MINMAX_API_KEY"
} else {
  Write-Host "[FAIL] MINMAX_API_KEY"
}
```

Create `scripts/verify.ps1`:

```powershell
$ErrorActionPreference = "Stop"

cmd /c npm.cmd test -- --run
cmd /c npx.cmd tsc --noEmit
cmd /c npm.cmd run build
```

Create `scripts/dev.ps1`:

```powershell
$ErrorActionPreference = "Stop"

cmd /c npm.cmd run dev
```

Create `scripts/bootstrap.ps1`:

```powershell
$ErrorActionPreference = "Stop"

Write-Host "1. Install Node.js 20+"
Write-Host "2. Run: cmd /c npm.cmd install"
Write-Host "3. Run: powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1"
Write-Host "4. Run: powershell -ExecutionPolicy Bypass -File scripts/dev.ps1"
```

- [ ] **Step 4: Run the checks to verify they pass**

Run:

```powershell
@(
  'scripts/doctor.ps1',
  'scripts/verify.ps1',
  'scripts/dev.ps1',
  'scripts/bootstrap.ps1'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `True`

- [ ] **Step 5: Commit**

```bash
git add scripts/doctor.ps1 scripts/verify.ps1 scripts/dev.ps1 scripts/bootstrap.ps1
git commit -m "chore: add harness setup and verification scripts"
```

### Task 4: Update README For Harness Workflow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the failing content check**

```powershell
Select-String -Path README.md -Pattern 'AGENTS.md|scripts/doctor.ps1|scripts/verify.ps1'
```

Expected: no matches

- [ ] **Step 2: Run the check to verify it fails**

Run: `Select-String -Path README.md -Pattern 'AGENTS.md|scripts/doctor.ps1|scripts/verify.ps1'`
Expected: no output

- [ ] **Step 3: Write minimal implementation**

Update `README.md` with these sections:

```md
## Harness Workflow

Read `AGENTS.md` first for repo navigation.

## Repo Docs

- `docs/harness/repo-map.md`
- `docs/architecture/video-analysis-system.md`
- `docs/product/web-app-scope.md`

## Scripts

- `powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `Select-String -Path README.md -Pattern 'AGENTS.md|scripts/doctor.ps1|scripts/verify.ps1'`
Expected: matches for all three strings

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document harness workflow"
```

### Task 5: Verify The Harness Foundation End To End

**Files:**
- Modify: `docs/harness/verification.md`

- [ ] **Step 1: Run environment diagnostics**

Run: `powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1`
Expected: report installed and missing dependencies without crashing

- [ ] **Step 2: Run repo verification**

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`
Expected: current test suite, type check, and build complete successfully

- [ ] **Step 3: Tighten verification doc if needed**

If the commands in `scripts/verify.ps1` differ from `docs/harness/verification.md`, update the doc so both match exactly:

```md
## Script Entry Point

Use:

`powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`

This script currently runs:

- `cmd /c npm.cmd test -- --run`
- `cmd /c npx.cmd tsc --noEmit`
- `cmd /c npm.cmd run build`
```

- [ ] **Step 4: Commit**

```bash
git add docs/harness/verification.md
git commit -m "docs: align verification guide with harness scripts"
```

### Task 6: Prepare The Next Planning Layer

**Files:**
- Create: `docs/examples/api/.gitkeep`

- [ ] **Step 1: Write the failing file check**

```powershell
Test-Path docs/examples/api/.gitkeep
```

Expected: `False`

- [ ] **Step 2: Run the check to verify it fails**

Run: `Test-Path docs/examples/api/.gitkeep`
Expected: `False`

- [ ] **Step 3: Write minimal implementation**

Create the API examples directory placeholder:

```text
docs/examples/api/.gitkeep
```

This reserves the intended location for future front-end and back-end contract examples without forcing API design work into the current harness-foundation change.

- [ ] **Step 4: Run the check to verify it passes**

Run: `Test-Path docs/examples/api/.gitkeep`
Expected: `True`

- [ ] **Step 5: Commit**

```bash
git add docs/examples/api/.gitkeep
git commit -m "chore: reserve api examples directory"
```
