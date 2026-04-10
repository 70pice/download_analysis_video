# Frontend And FastAPI Video Analysis Design

## Goal

Evolve the current single-project Next.js prototype into a deployable web application with a separated front end and back end.

The first implementation target is a single-user admin console that accepts a video URL, downloads the source video on the server, performs local preprocessing and slicing, sends clip-level analysis requests to MinMax API, and presents a complete analysis result that includes clip understanding, storyboard output, and remix planning.

## Why This Shape

The current repository already proves the core product loop:

- submit a source input
- run a staged pipeline
- persist artifacts
- inspect the result in a review-oriented UI

What it does not yet provide is a production-appropriate separation of concerns. Downloading, orchestration, storage, and UI are still colocated inside the Next.js app. That makes the current prototype easy to demo, but it is not the right long-term shape for a server-deployed system that will eventually handle real video binaries, local media tooling, and external model calls.

This design keeps the current strengths:

- staged pipeline
- inspectable artifacts
- reviewer-first outputs

and moves them into a cleaner architecture:

- `frontend/` owns the web UI
- `backend/` owns download, slicing, analysis orchestration, and artifact APIs
- `storage/` owns runtime artifacts on disk

## Product Scope

### In Scope

- single-user admin console
- video URL input only
- local video download on the server
- local video metadata extraction
- local video slicing before model analysis
- MinMax API for clip-level understanding
- persisted task state and artifacts
- web UI for progress, clip analysis, storyboard, and remix plan review

### Out Of Scope

- authentication
- multi-user separation
- direct local model inference
- batch input
- background worker infrastructure such as Celery or Redis in this phase
- final rendered video generation

## Current State

The current runtime architecture is:

- Next.js app router UI
- Next.js route handlers for server operations
- filesystem-backed project artifacts under `data/projects/current/`
- mock pipeline providers for ingest, transcript, shot detection, shot understanding, storyboard, and remix plan

The current contract layer is still useful. The new system should preserve the same core output concepts, even when the implementation moves to Python:

- source artifact
- transcript artifact
- shots artifact
- shot understanding artifact
- storyboard artifact
- remix plan artifact

## Target Architecture

### Front End

`frontend/` should be a Next.js application responsible for:

- the URL submission screen
- recent job list
- job detail page
- polling or streaming task state
- rendering clip analysis, storyboard summary, and remix plan

The front end should not contain download or analysis logic. It should call the back end through HTTP APIs only.

### Back End

`backend/` should be a FastAPI service responsible for:

- creating analysis jobs
- downloading source videos from URLs
- running local media inspection
- slicing the video into analysis clips
- calling MinMax API for clip understanding
- building higher-level artifacts such as storyboard and remix plan
- exposing job state and artifact retrieval APIs

### Storage

`storage/` should hold per-job runtime artifacts on the server filesystem.

Each job should live under a dedicated folder:

```text
storage/jobs/<job_id>/
  job.json
  source/
    source.json
    original.mp4
  derived/
    clips/
    keyframes/
    transcript.json
    shots.json
  analysis/
    clip_understanding.json
    storyboard.json
    remix_plan.json
```

This layout preserves the current "artifact-first" shape while making room for real binary assets.

## Job Model

The system should promote the current project concept into an explicit job model.

### Job-Level Status

- `queued`
- `downloading`
- `processing`
- `completed`
- `failed`

### Stage-Level Status

- `download_video`
- `inspect_video`
- `slice_video`
- `analyze_clips`
- `build_storyboard`
- `generate_remix_plan`

Each stage should record:

- key
- label
- status
- error
- updated timestamp

The front end can reuse the current staged-progress presentation model with updated stage names.

## Data Contracts

### Source Artifact

The source artifact should include:

- original input URL
- resolved download URL if different
- platform classification
- title if available
- author if available
- duration
- resolution
- local file path metadata

### Shots Artifact

The shots artifact should describe the local slicing output:

- clip id
- start time
- end time
- clip file path
- representative keyframe path

### Clip Understanding Artifact

Each clip analysis result should include:

- clip id
- summary
- people or subjects
- scene
- blocking or movement
- camera language
- dialogue or subtitle summary if available
- tags
- confidence

### Storyboard Artifact

The storyboard artifact should summarize whole-video structure:

- theme
- narrative arc
- visual motifs
- audience hook
- segment summary

### Remix Plan Artifact

The remix artifact should remain editor-friendly:

- title
- creative intent
- target audience
- segments
- each segment includes beats, source clip references, scene plan, blocking plan, camera plan, narration, prompt text, and notes

## Back-End API Design

The initial API surface should stay small.

### `POST /api/v1/jobs`

Create a new analysis job.

Request:

- `source_url`

Response:

- `job_id`
- current job state

### `GET /api/v1/jobs`

Return the recent jobs list for the admin console.

### `GET /api/v1/jobs/{job_id}`

Return job metadata, stage states, and summary status.

### `GET /api/v1/jobs/{job_id}/artifacts`

Return the structured artifacts needed by the UI.

### `POST /api/v1/jobs/{job_id}/retry`

Retry a failed job from the beginning in this phase.

### `DELETE /api/v1/jobs/{job_id}`

Delete the job metadata and local artifacts.

## Front-End Screens

### Dashboard

The dashboard should provide:

- URL input form
- submit button
- recent jobs list
- status badges

### Job Detail

The detail page should provide:

- source summary
- stage progress
- clip analysis list
- storyboard summary
- remix plan view

Desktop is the priority. Mobile only needs to remain readable.

## Pipeline Behavior

The first real pipeline should proceed in this order:

1. `download_video`
   - resolve and download the source video
2. `inspect_video`
   - collect media metadata
3. `slice_video`
   - generate clips and representative frames
4. `analyze_clips`
   - send each clip to MinMax API and collect structured understanding
5. `build_storyboard`
   - summarize the full set of clip analyses
6. `generate_remix_plan`
   - generate the higher-level creative plan

Every stage must persist output before moving to the next stage.

## MinMax Integration Strategy

MinMax should only be used where it creates leverage:

- clip-level understanding
- full-video synthesis from clip results

It should not be responsible for local media handling. That remains in the FastAPI service and system binaries such as `ffmpeg`.

The integration layer should be isolated behind a service boundary so future provider changes do not affect route handlers or UI code directly.

## Deployment Baseline

The first deployment target is one Linux server hosting:

- `frontend` process
- `backend` process
- local artifact storage
- system binaries for `ffmpeg`, `ffprobe`, and `yt-dlp`

An Nginx reverse proxy can route:

- `/api/` to FastAPI
- everything else to Next.js

## Migration Strategy

### Phase 1: Preserve Contracts, Split Structure

- create `frontend/` and `backend/`
- move the current UI into `frontend/` in a minimal form
- stand up FastAPI skeleton in `backend/`
- keep current artifact semantics

### Phase 2: Replace Mock Pipeline With Real Media Steps

- implement download
- implement metadata inspection
- implement slicing
- keep higher-level artifact names stable

### Phase 3: Add MinMax Provider Layer

- implement clip-level analysis adapter
- implement full-video synthesis adapter
- connect artifacts to the existing review UI shape

### Phase 4: Stabilize Server Deployment

- finalize environment variables
- finalize storage paths
- document server startup and reverse proxy assumptions

## Risks And Mitigations

### Risk: Rewriting Too Much At Once

If the split is attempted as a full rewrite, the current working prototype value will be lost during migration.

Mitigation:

- preserve output contracts
- migrate in phases
- keep the UI shape recognizable

### Risk: Front-End And Back-End Drift

If the API is not explicitly documented, the front end and back end will diverge during development.

Mitigation:

- document request and response examples under `docs/examples/api/`
- keep the contract names stable

### Risk: Local Media Tooling Differences

Real video handling depends on server binaries and environment setup.

Mitigation:

- keep `scripts/doctor.ps1` and future Linux equivalents current
- document binary requirements in deployment docs

## Success Criteria

This design is successful when:

- the repo gains a real `frontend/` and `backend/` split
- a user can submit a URL through the front end
- the back end downloads and slices the video locally
- MinMax API provides clip analysis
- the UI renders clip analysis, storyboard, and remix plan from the back-end artifacts
- the resulting system is deployable on a single server without depending on the current in-process Next.js pipeline
