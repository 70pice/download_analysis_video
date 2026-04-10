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
