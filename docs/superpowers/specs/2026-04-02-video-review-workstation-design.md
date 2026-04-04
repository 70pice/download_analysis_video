# Video Review Workstation Design

## Goal

Build a single-project immersive web review workstation that turns a short-video URL into:

- downloadable source metadata
- structured shot-level analysis
- a higher-level storyboard summary
- an editable remix plan for creating a new short video later

The first implementation explicitly excludes direct JiMeng CLI execution. The output contract must make that integration straightforward later.

## Why This Shape

The design borrows two proven ideas from the reference projects:

- `story-ai-cutting`: keep the workflow staged and persist every intermediate artifact
- `Video-Materials-AutoGEN-Workstation`: treat creative work as a project with inspectable assets rather than one opaque script

The product focus is not a generic production console. It is a reviewer-first workstation where the original analysis stays visible while the new creative plan is edited alongside it.

## Product Scope

### In Scope

- Single-project immersive UI
- Input a short-video URL
- Create one project workspace on the server
- Run a staged pipeline with persisted status and artifacts
- Review original shot analysis
- Edit the generated remix plan
- Re-run remix generation without recreating the project
- Export machine-readable artifacts

### Out of Scope

- Multi-project dashboard
- Authentication
- Direct JiMeng CLI calls
- Full editing of raw video clips in-browser
- Final rendered video generation

## UX Structure

The UI is a single page with four areas:

1. Top bar
   - URL input
   - start analysis button
   - rerun remix button
   - export button
   - pipeline status
2. Left review pane
   - source summary
   - transcript summary
   - shot list with timestamps, entities, scene, camera, dialogue
3. Right creation pane
   - editable remix segments
   - goal, hook, scene, cast blocking, camera language, narration, prompts
4. Footer/status pane
   - artifact file states
   - warnings and next-step hints

Desktop is the primary target. Mobile should remain readable but not fully optimized in this phase.

## Architecture

Use a web-first Node stack so the project is runnable in the current environment:

- Next.js app router for UI and API routes
- filesystem-backed project storage
- in-process pipeline runner with stage status persistence
- pluggable adapters for download, transcription, shot analysis, and remix generation

This preserves the intended pipeline architecture while avoiding a separate Python runtime dependency in the first runnable version.

## Project Layout

```text
data/projects/current/
  project.json
  source/
    source.json
  derived/
    transcript.json
    shots.json
  analysis/
    shot_understanding.json
    storyboard.json
    remix_plan.json
  review/
    remix_plan.edited.json
```

## Data Contracts

### project.json

- `id`
- `sourceUrl`
- `status`
- `activeStage`
- `createdAt`
- `updatedAt`
- `stages[]`

### transcript.json

- `language`
- `fullText`
- `segments[]` with `startMs`, `endMs`, `text`

### shots.json

- `shots[]` with `id`, `startMs`, `endMs`, `keyframeLabel`

### shot_understanding.json

- `shots[]`
- each shot has `summary`, `people[]`, `scene`, `blocking`, `camera`, `dialogue`, `tags[]`, `confidence`

### storyboard.json

- `theme`
- `narrativeArc`
- `visualMotifs[]`
- `audienceHook`

### remix_plan.json

- `title`
- `creativeIntent`
- `targetAudience`
- `segments[]`
- each segment has `id`, `goal`, `beats`, `sourceShotIds[]`, `scenePlan`, `blockingPlan`, `cameraPlan`, `narration`, `visualPrompt`, `notes`

### remix_plan.edited.json

Same shape as `remix_plan.json`, plus:

- `editedAt`
- `editor: "local-user"`

## Pipeline Stages

1. `ingest`
   - normalize the URL into source metadata
2. `transcribe`
   - create transcript artifact
3. `detect_shots`
   - create shot boundaries
4. `understand_shots`
   - enrich each shot into reviewer-friendly semantics
5. `build_storyboard`
   - summarize whole-video structure
6. `generate_remix_plan`
   - produce editable creative plan

Each stage must write output to disk before the next stage runs.

## Provider Strategy

The first runnable version uses deterministic mock providers so the full UX can be exercised without external tools.

Provider interfaces:

- `IngestProvider`
- `TranscriptProvider`
- `ShotProvider`
- `ShotUnderstandingProvider`
- `StoryboardProvider`
- `RemixPlanProvider`

Later real adapters can target:

- `yt-dlp`
- `ffmpeg`
- Whisper / Faster-Whisper
- VLM / LLM APIs

## Error Handling

- Project creation must never partially succeed without writing `project.json`
- Any stage failure updates stage state and project state
- Existing successful artifacts remain visible
- UI shows the failed stage and error message
- Rerunning remix generation should not wipe edited review output without explicit intent

## Testing

Minimum coverage for this phase:

- project storage read/write
- pipeline stage execution and persistence
- remix plan generation contract
- API route success path
- edit/save remix plan workflow

## Success Criteria

The first version is successful if:

- a user can submit a URL
- the pipeline completes using the local mock providers
- the review UI renders shot analysis and remix segments
- remix edits are persisted to disk
- exported artifacts are inspectable and stable enough for future JiMeng integration
