# Video Analysis Harness Repo Design

## Goal

Turn this repository into a standard development harness for a deployable video download and analysis web application.

The harness focus is not the runtime product itself. The goal is to make the repository easy for humans and coding agents to understand, change, verify, and extend while the product evolves from the current single-project mock workstation into a front-end and back-end separated web system.

## Why This Shape

This design follows the core ideas from OpenAI's harness engineering article:

- keep `AGENTS.md` short and use it as a navigation layer, not a knowledge dump
- move durable project knowledge into versioned docs inside the repo
- make validation and environment checks explicit and scriptable
- treat design docs and execution plans as first-class development artifacts
- reduce ambiguity so an agent can enter the repo, find the right context quickly, and make changes safely

This repository already has useful ingredients for a future product:

- a staged analysis pipeline
- persisted artifact contracts
- a review-oriented UI
- tests around storage, routes, and pipeline behavior

What it does not yet have is the repo-level harness needed for sustained development. Knowledge is still concentrated in source files and ad hoc context rather than a stable repo map and workflow.

## Product Direction Context

The target product direction that this harness should support is:

- deployable web application
- front-end and back-end separated
- first phase is a single-user admin console
- input is video URL only
- server downloads the source video locally
- server performs local preprocessing such as metadata extraction and video slicing
- MinMax API performs clip-level understanding
- the final output includes clip analysis, storyboard summary, and remix plan

The harness does not implement all of that by itself. It creates the repo structure and workflows needed to build it cleanly.

## In Scope

- define the repository as a development harness
- add a short root `AGENTS.md`
- establish a durable docs structure for architecture, product scope, harness workflow, specs, and plans
- define standard verification and environment-check scripts
- define how future front-end and back-end separation should appear in the repo
- define where API examples and operational notes should live
- define contribution rules for agents and humans working in the repo

## Out Of Scope

- fully implementing the new front-end and FastAPI back-end
- adding authentication or multi-user support
- building the real MinMax adapter in this phase
- wiring production task queues such as Redis or Celery in this phase
- replacing the current runtime pipeline immediately

## Current State

The current repo is a Next.js application with route handlers and a local artifact pipeline. It behaves like a single-project review workstation:

- source input is submitted through the web UI
- the pipeline runs inside the app layer
- mock providers generate transcript, shots, shot understanding, storyboard, and remix plan artifacts
- artifacts are persisted under `data/projects/current/`
- tests cover the current contracts and review workflow

This is a good product prototype, but not yet a harness-first repository. Future development would be easier if the repo itself exposed:

- a clear map of code and docs
- a standard design and planning workflow
- one-command environment diagnostics
- one-command verification
- stable documentation for deployment assumptions and interfaces

## Design Principles

### 1. The Repo Must Explain Itself

The root of the repository must answer four questions quickly:

- what this project is
- where product architecture is documented
- where active plans live
- how to verify changes

`AGENTS.md` should do only that. It should not duplicate long architecture explanations or API details.

### 2. Docs Are The Long-Term Memory

Long-form knowledge should live in versioned files under `docs/`, not in chat history or only in source comments.

The docs should be split by purpose:

- stable architecture context
- product scope and boundaries
- harness workflow and repo map
- feature specs
- implementation plans

### 3. Verification Is Part Of The Interface

Anyone entering the repo should be able to answer:

- are the required tools installed
- how do I start local development
- what command verifies the repo before completion

This means the harness must include scripts for:

- environment diagnostics
- local development startup
- repo verification

### 4. Separate Product Evolution From Repo Discipline

The product can change from a Next.js monolith to a separated Next.js plus FastAPI system, but the harness rules should remain stable:

- document before implementing major changes
- plan before multi-step work
- keep interfaces inspectable
- update examples and docs with code changes

## Target Repository Shape

The repository should evolve toward this structure:

```text
/
+-- AGENTS.md
+-- README.md
+-- docs/
|   +-- architecture/
|   |   +-- video-analysis-system.md
|   +-- product/
|   |   +-- web-app-scope.md
|   +-- harness/
|   |   +-- repo-map.md
|   |   +-- development-workflow.md
|   |   +-- verification.md
|   |   +-- deployment-baseline.md
|   +-- superpowers/
|   |   +-- specs/
|   |   +-- plans/
|   +-- examples/
|       +-- api/
+-- frontend/
+-- backend/
+-- storage/
+-- scripts/
|   +-- bootstrap.ps1
|   +-- doctor.ps1
|   +-- dev.ps1
|   +-- verify.ps1
+-- .env.example
```

This does not require every directory to be created immediately. It defines the intended shape so future work lands in the right place.

## AGENTS.md Design

The root `AGENTS.md` should be intentionally short. It should include:

- one sentence for project purpose
- one short section listing the most important directories
- one short section listing the first docs to read
- one short section listing required verification commands
- one short section describing documentation update rules

It should not include:

- full architecture writeups
- API payload definitions
- deployment walkthroughs
- repeated copies of plan content

The target effect is that an agent can open `AGENTS.md`, orient quickly, then follow links into the correct deeper docs.

## Docs Layout

### `docs/architecture/`

Stable system-level decisions live here:

- current product architecture
- target front-end and back-end separation
- artifact flow
- storage layout
- service boundaries

Primary file:

- `docs/architecture/video-analysis-system.md`

### `docs/product/`

Product scope and user-facing behavior live here:

- first-phase capabilities
- constraints
- accepted inputs
- expected outputs
- non-goals

Primary file:

- `docs/product/web-app-scope.md`

### `docs/harness/`

Repo-operating knowledge lives here:

- `repo-map.md`
  explains what each top-level directory is for
- `development-workflow.md`
  explains spec -> plan -> implementation -> verification workflow
- `verification.md`
  explains what `scripts/verify.ps1` runs and when to use it
- `deployment-baseline.md`
  explains local and server assumptions for the future split system

### `docs/superpowers/specs/`

Feature or restructuring designs live here. This current document belongs in that category because it defines a major repo-level change.

### `docs/superpowers/plans/`

Execution plans live here once a spec is approved.

### `docs/examples/api/`

Example request and response payloads should live here once the separated API exists. These examples should be updated when API contracts change so front-end work, back-end work, and agent work stay aligned.

## Script Design

### `scripts/doctor.ps1`

Purpose:

- verify required tools are installed
- report versions
- detect missing configuration before development starts

Checks should include:

- Node.js
- npm
- Python
- pip
- `ffmpeg`
- `ffprobe`
- `yt-dlp`
- expected environment variables such as `MINMAX_API_KEY`

Output should clearly label:

- passed checks
- failed checks
- suggested next action

### `scripts/dev.ps1`

Purpose:

- start the local development environment with the fewest manual steps

Initial expectation:

- start the current Next.js app now
- later evolve to start both `frontend` and `backend`

### `scripts/verify.ps1`

Purpose:

- run the required validation before claiming completion

Initial expectation:

- front-end tests
- type checks
- build checks

Later expectation after repo split:

- front-end tests and build
- back-end tests
- API schema or contract checks

### `scripts/bootstrap.ps1`

Purpose:

- document or automate first-time local setup where practical

This can start simple by printing the required install steps and validating directory setup.

## Future Code Layout

The harness should prepare for this product code split:

- `frontend/`
  Next.js admin console
- `backend/`
  FastAPI application for jobs, download, slicing, MinMax calls, and artifact access
- `storage/`
  local job artifacts for development and server deployment

The current `src/` structure is still valid during transition. The harness should make the intended migration path explicit rather than forcing an immediate big-bang rewrite.

## Development Workflow

The standard repo workflow should be:

1. Write or update a spec for any meaningful feature or structural change.
2. Review and approve the spec.
3. Write an implementation plan in `docs/superpowers/plans/`.
4. Implement in small, verifiable steps.
5. Run `scripts/verify.ps1`.
6. Update docs and API examples if behavior or interfaces changed.

This workflow is important because the repository is being optimized for repeated agent involvement. Plans and verification commands must be discoverable without relying on prior chat context.

## Verification Rules

Before work is considered complete, the repo should support a standard verification path.

For the current state:

- `cmd /c npm.cmd test -- --run`
- `cmd /c npx.cmd tsc --noEmit`
- `cmd /c npm.cmd run build`

After the repo is split:

- front-end install, test, type check, build
- back-end install, test, lint or import check
- optional smoke test for API contract examples

The repo docs should state clearly which checks are mandatory for which area of change.

## Migration Strategy

The harness conversion should happen in phases.

### Phase 1: Repo Harness Foundation

- add root `AGENTS.md`
- add harness docs under `docs/harness/`
- add PowerShell scripts for diagnostics and verification
- update `README.md` to describe the harness workflow

### Phase 2: Product Architecture Documentation

- write stable architecture doc for the target split system
- write product scope doc for first-phase single-user deployment
- document planned runtime directories and environment variables

### Phase 3: Codebase Restructuring

- introduce `frontend/` and `backend/`
- migrate current front-end pieces into `frontend/`
- implement FastAPI service in `backend/`
- preserve or migrate artifact contracts intentionally

### Phase 4: Contract Stabilization

- add API examples
- add deployment baseline docs
- align verify script with split architecture

## Risks And Mitigations

### Risk: Two Documentation Systems

If the repo adds new docs without respecting the existing `docs/superpowers/` structure, documentation will fragment.

Mitigation:

- keep specs and plans in the existing `docs/superpowers/` hierarchy
- add new stable repo docs in clearly named sibling directories under `docs/`

### Risk: Harness Docs Drift Away From Code

If docs are created but not tied to workflow, they will become stale.

Mitigation:

- require doc updates when interfaces or structure change
- keep `AGENTS.md` small so it is easy to maintain
- centralize verification and setup instructions in scripts

### Risk: Premature Full Rewrite

Trying to convert the product architecture and the harness structure in one large step would raise delivery risk.

Mitigation:

- land the harness first
- document the target split architecture
- then migrate code in phases

## Success Criteria

This harness design is successful when:

- a new agent can open the repo and find the right docs within minutes
- the root `AGENTS.md` acts as a clear navigation file rather than a long manual
- major work starts from a spec and plan stored in the repo
- environment and verification steps are available through standard scripts
- the repository clearly documents the path from the current Next.js prototype to the future front-end and back-end separated system
