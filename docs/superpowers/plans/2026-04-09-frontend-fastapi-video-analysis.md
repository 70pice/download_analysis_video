# Frontend And FastAPI Video Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current Next.js prototype into a `frontend/` web client and a `backend/` FastAPI service while preserving the existing artifact-first review workflow and preparing the system for real video download, slicing, and MinMax analysis.

**Architecture:** Keep the current `src/` implementation as the reference baseline while introducing parallel `frontend/` and `backend/` applications. Migrate contracts and user flows first, then replace the mock in-process pipeline with a FastAPI-owned job pipeline that downloads video locally, slices it with system tooling, and returns the same high-level artifacts the UI already knows how to render.

**Tech Stack:** Next.js, React, TypeScript, Vitest, FastAPI, Pydantic, Python, ffmpeg, ffprobe, yt-dlp, MinMax API

---

### Task 1: Scaffold The Split Repo Structure

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/globals.css`
- Create: `backend/requirements.txt`
- Create: `backend/app/main.py`
- Create: `backend/app/__init__.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/tests/__init__.py`
- Modify: `README.md`
- Test: `frontend/package.json`

- [ ] **Step 1: Write the failing structure test**

```powershell
@(
  'frontend/package.json',
  'frontend/src/app/page.tsx',
  'backend/requirements.txt',
  'backend/app/main.py'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 2: Run the check to verify it fails**

Run:

```powershell
@(
  'frontend/package.json',
  'frontend/src/app/page.tsx',
  'backend/requirements.txt',
  'backend/app/main.py'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 3: Write minimal implementation**

Create the new repo skeleton:

`frontend/package.json`

```json
{
  "name": "video-analysis-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest"
  },
  "dependencies": {
    "next": "^15.5.14",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.13.10",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.2",
    "vitest": "^3.2.4"
  }
}
```

`frontend/src/app/page.tsx`

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Video Analysis Admin</h1>
      <p>Frontend split scaffold is ready.</p>
    </main>
  );
}
```

`backend/requirements.txt`

```txt
fastapi==0.115.12
uvicorn[standard]==0.34.0
pydantic==2.10.6
httpx==0.28.1
pytest==8.3.5
```

`backend/app/main.py`

```python
from fastapi import FastAPI

app = FastAPI(title="Video Analysis Backend")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

Update `README.md` so it mentions the repo is now in transition from `src/` to `frontend/` and `backend/`.

- [ ] **Step 4: Run the check to verify it passes**

Run:

```powershell
@(
  'frontend/package.json',
  'frontend/src/app/page.tsx',
  'backend/requirements.txt',
  'backend/app/main.py'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `True`

- [ ] **Step 5: Commit**

```bash
git add frontend backend README.md
git commit -m "chore: scaffold frontend and backend split"
```

### Task 2: Port The Shared Contract Layer

**Files:**
- Create: `frontend/src/lib/contracts.ts`
- Create: `backend/app/schemas/contracts.py`
- Create: `docs/examples/api/job-detail.json`
- Test: `frontend/src/lib/contracts.ts`
- Test: `backend/tests/test_contracts.py`

- [ ] **Step 1: Write the failing contract checks**

```powershell
@(
  'frontend/src/lib/contracts.ts',
  'backend/app/schemas/contracts.py',
  'docs/examples/api/job-detail.json'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 2: Run the checks to verify they fail**

Run:

```powershell
@(
  'frontend/src/lib/contracts.ts',
  'backend/app/schemas/contracts.py',
  'docs/examples/api/job-detail.json'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `False`

- [ ] **Step 3: Write minimal implementation**

Copy the current semantic contract layer into both sides with the updated job model.

`frontend/src/lib/contracts.ts`

```ts
import { z } from "zod";

export const stageStatusSchema = z.enum(["pending", "running", "complete", "failed"]);
export const jobStatusSchema = z.enum(["queued", "downloading", "processing", "completed", "failed"]);

export const stageSchema = z.object({
  key: z.string(),
  label: z.string(),
  status: stageStatusSchema,
  error: z.string().nullable(),
  updatedAt: z.string(),
});

export const jobRecordSchema = z.object({
  id: z.string(),
  sourceUrl: z.string().url(),
  status: jobStatusSchema,
  activeStage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stages: z.array(stageSchema),
});

export type JobRecord = z.infer<typeof jobRecordSchema>;
```

`backend/app/schemas/contracts.py`

```python
from pydantic import BaseModel, HttpUrl
from typing import Literal

StageStatus = Literal["pending", "running", "complete", "failed"]
JobStatus = Literal["queued", "downloading", "processing", "completed", "failed"]


class StageRecord(BaseModel):
    key: str
    label: str
    status: StageStatus
    error: str | None
    updatedAt: str


class JobRecord(BaseModel):
    id: str
    sourceUrl: HttpUrl
    status: JobStatus
    activeStage: str | None
    createdAt: str
    updatedAt: str
    stages: list[StageRecord]
```

`docs/examples/api/job-detail.json`

```json
{
  "job": {
    "id": "job_001",
    "sourceUrl": "https://example.com/video",
    "status": "processing",
    "activeStage": "analyze_clips",
    "createdAt": "2026-04-09T12:00:00.000Z",
    "updatedAt": "2026-04-09T12:05:00.000Z",
    "stages": [
      {
        "key": "download_video",
        "label": "Download video",
        "status": "complete",
        "error": null,
        "updatedAt": "2026-04-09T12:01:00.000Z"
      }
    ]
  }
}
```

- [ ] **Step 4: Run the checks to verify they pass**

Run:

```powershell
@(
  'frontend/src/lib/contracts.ts',
  'backend/app/schemas/contracts.py',
  'docs/examples/api/job-detail.json'
) | ForEach-Object { "{0}:{1}" -f $_, (Test-Path $_) }
```

Expected: every line ends with `True`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/contracts.ts backend/app/schemas/contracts.py docs/examples/api/job-detail.json
git commit -m "feat: add shared frontend and backend job contracts"
```

### Task 3: Build The FastAPI Job API Skeleton

**Files:**
- Create: `backend/app/api/routes_jobs.py`
- Create: `backend/app/services/job_store.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_jobs_api.py`

- [ ] **Step 1: Write the failing API test**

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_and_jobs_list():
    response = client.get("/api/v1/jobs")
    assert response.status_code == 200
    assert response.json() == {"items": []}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend; python -m pytest backend/tests/test_jobs_api.py -q`
Expected: FAIL because `/api/v1/jobs` does not exist yet

- [ ] **Step 3: Write minimal implementation**

`backend/app/services/job_store.py`

```python
from pathlib import Path

STORAGE_ROOT = Path("storage/jobs")


def list_jobs() -> list[dict]:
    return []
```

`backend/app/api/routes_jobs.py`

```python
from fastapi import APIRouter
from app.services.job_store import list_jobs

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("")
def get_jobs() -> dict[str, list[dict]]:
    return {"items": list_jobs()}
```

`backend/app/main.py`

```python
from fastapi import FastAPI
from app.api.routes_jobs import router as jobs_router

app = FastAPI(title="Video Analysis Backend")
app.include_router(jobs_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend; python -m pytest backend/tests/test_jobs_api.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/routes_jobs.py backend/app/services/job_store.py backend/app/main.py backend/tests/test_jobs_api.py
git commit -m "feat: add fastapi jobs api skeleton"
```

### Task 4: Add Filesystem-Backed Job Storage

**Files:**
- Modify: `backend/app/services/job_store.py`
- Create: `backend/app/core/paths.py`
- Test: `backend/tests/test_job_store.py`

- [ ] **Step 1: Write the failing job-store test**

```python
from app.services.job_store import create_job, list_jobs


def test_create_and_list_job():
    job = create_job("https://example.com/video")
    items = list_jobs()
    assert items[0]["id"] == job["id"]
    assert items[0]["sourceUrl"] == "https://example.com/video"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend; python -m pytest backend/tests/test_job_store.py -q`
Expected: FAIL because `create_job` does not exist

- [ ] **Step 3: Write minimal implementation**

`backend/app/core/paths.py`

```python
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
STORAGE_ROOT = REPO_ROOT / "storage" / "jobs"
```

`backend/app/services/job_store.py`

```python
from datetime import datetime, UTC
from uuid import uuid4
import json
from app.core.paths import STORAGE_ROOT


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def create_job(source_url: str) -> dict:
    job_id = f"job_{uuid4().hex[:12]}"
    job = {
        "id": job_id,
        "sourceUrl": source_url,
        "status": "queued",
        "activeStage": None,
        "createdAt": _timestamp(),
        "updatedAt": _timestamp(),
        "stages": [],
    }
    job_dir = STORAGE_ROOT / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    (job_dir / "job.json").write_text(json.dumps(job, indent=2), encoding="utf-8")
    return job


def list_jobs() -> list[dict]:
    if not STORAGE_ROOT.exists():
        return []
    items = []
    for path in STORAGE_ROOT.glob("*/job.json"):
        items.append(json.loads(path.read_text(encoding="utf-8")))
    return sorted(items, key=lambda item: item["createdAt"], reverse=True)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend; python -m pytest backend/tests/test_job_store.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/paths.py backend/app/services/job_store.py backend/tests/test_job_store.py
git commit -m "feat: add filesystem job store"
```

### Task 5: Connect Frontend Dashboard To The New API

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/components/jobs-dashboard.tsx`
- Modify: `frontend/src/app/page.tsx`
- Test: `frontend/src/tests/jobs-dashboard.test.tsx`

- [ ] **Step 1: Write the failing frontend test**

```tsx
import { render, screen } from "@testing-library/react";
import { JobsDashboard } from "@/components/jobs-dashboard";

test("renders url form and jobs heading", () => {
  render(<JobsDashboard initialJobs={[]} />);
  expect(screen.getByText(/video analysis admin/i)).toBeInTheDocument();
  expect(screen.getByText(/recent jobs/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend; cmd /c npm.cmd test -- --run src/tests/jobs-dashboard.test.tsx`
Expected: FAIL because the component does not exist

- [ ] **Step 3: Write minimal implementation**

`frontend/src/lib/api.ts`

```ts
export async function fetchJobs(baseUrl = "http://localhost:8000") {
  const response = await fetch(`${baseUrl}/api/v1/jobs`, { cache: "no-store" });
  return response.json();
}
```

`frontend/src/components/jobs-dashboard.tsx`

```tsx
type JobsDashboardProps = {
  initialJobs: Array<{ id: string; sourceUrl: string; status: string }>;
};

export function JobsDashboard({ initialJobs }: JobsDashboardProps) {
  return (
    <main>
      <h1>Video Analysis Admin</h1>
      <form>
        <label htmlFor="source-url">Source URL</label>
        <input id="source-url" name="source-url" />
        <button type="submit">Create Job</button>
      </form>
      <section>
        <h2>Recent Jobs</h2>
        <ul>
          {initialJobs.map((job) => (
            <li key={job.id}>{job.sourceUrl}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

`frontend/src/app/page.tsx`

```tsx
import { JobsDashboard } from "@/components/jobs-dashboard";

export default function HomePage() {
  return <JobsDashboard initialJobs={[]} />;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend; cmd /c npm.cmd test -- --run src/tests/jobs-dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/components/jobs-dashboard.tsx frontend/src/app/page.tsx frontend/src/tests/jobs-dashboard.test.tsx
git commit -m "feat: add frontend jobs dashboard"
```

### Task 6: Implement Real Download And Inspection Services

**Files:**
- Create: `backend/app/services/download_service.py`
- Create: `backend/app/services/media_inspection.py`
- Create: `backend/tests/test_download_service.py`
- Create: `backend/tests/test_media_inspection.py`
- Modify: `docs/harness/deployment-baseline.md`

- [ ] **Step 1: Write the failing download test**

```python
from app.services.download_service import build_download_command


def test_build_download_command():
    command = build_download_command("https://example.com/video", "storage/jobs/job_001/source")
    assert command[0] == "yt-dlp"
    assert "https://example.com/video" in command
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend; python -m pytest backend/tests/test_download_service.py -q`
Expected: FAIL because `build_download_command` does not exist

- [ ] **Step 3: Write minimal implementation**

`backend/app/services/download_service.py`

```python
from pathlib import Path


def build_download_command(source_url: str, output_dir: str) -> list[str]:
    output_template = str(Path(output_dir) / "original.%(ext)s")
    return ["yt-dlp", "-o", output_template, source_url]
```

`backend/app/services/media_inspection.py`

```python
import json
import subprocess


def inspect_video(path: str) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)
```

Update `docs/harness/deployment-baseline.md` so the required server binaries section explicitly lists `yt-dlp`, `ffmpeg`, and `ffprobe`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend; python -m pytest backend/tests/test_download_service.py backend/tests/test_media_inspection.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/download_service.py backend/app/services/media_inspection.py backend/tests/test_download_service.py backend/tests/test_media_inspection.py docs/harness/deployment-baseline.md
git commit -m "feat: add real download and inspection services"
```

### Task 7: Add Local Slicing And MinMax Service Boundaries

**Files:**
- Create: `backend/app/services/slicing_service.py`
- Create: `backend/app/services/minmax_client.py`
- Create: `backend/app/services/pipeline_service.py`
- Create: `backend/tests/test_slicing_service.py`
- Create: `backend/tests/test_minmax_client.py`
- Create: `docs/examples/api/job-artifacts.json`

- [ ] **Step 1: Write the failing slicing test**

```python
from app.services.slicing_service import build_slice_command


def test_build_slice_command():
    command = build_slice_command("input.mp4", "clip-001.mp4", 0, 5)
    assert command[0] == "ffmpeg"
    assert "-ss" in command
    assert "-to" in command
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend; python -m pytest backend/tests/test_slicing_service.py -q`
Expected: FAIL because `build_slice_command` does not exist

- [ ] **Step 3: Write minimal implementation**

`backend/app/services/slicing_service.py`

```python
def build_slice_command(input_path: str, output_path: str, start_seconds: int, end_seconds: int) -> list[str]:
    return [
        "ffmpeg",
        "-y",
        "-i",
        input_path,
        "-ss",
        str(start_seconds),
        "-to",
        str(end_seconds),
        output_path,
    ]
```

`backend/app/services/minmax_client.py`

```python
class MinMaxClient:
    def analyze_clip(self, clip_path: str, keyframe_path: str | None = None) -> dict:
        return {
            "clipId": clip_path,
            "summary": "stub analysis",
            "people": [],
            "scene": "unknown",
            "blocking": "unknown",
            "camera": "unknown",
            "dialogue": "",
            "tags": [],
            "confidence": 0.0,
        }
```

`backend/app/services/pipeline_service.py`

```python
from app.services.download_service import build_download_command
from app.services.media_inspection import inspect_video
from app.services.slicing_service import build_slice_command
from app.services.minmax_client import MinMaxClient


class PipelineService:
    def __init__(self) -> None:
        self.minmax = MinMaxClient()

    def dependencies_ready(self) -> dict[str, bool]:
        return {
            "download": callable(build_download_command),
            "inspect": callable(inspect_video),
            "slice": callable(build_slice_command),
            "analyze": hasattr(self.minmax, "analyze_clip"),
        }
```

`docs/examples/api/job-artifacts.json`

```json
{
  "source": null,
  "shots": {
    "shots": [
      {
        "id": "clip-001",
        "startMs": 0,
        "endMs": 5000,
        "keyframeLabel": "opening frame"
      }
    ]
  },
  "clipUnderstanding": {
    "shots": [
      {
        "id": "clip-001",
        "summary": "A short opening shot",
        "people": [],
        "scene": "interior",
        "blocking": "static",
        "camera": "wide",
        "dialogue": "",
        "tags": ["intro"],
        "confidence": 0.8
      }
    ]
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend; python -m pytest backend/tests/test_slicing_service.py backend/tests/test_minmax_client.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/slicing_service.py backend/app/services/minmax_client.py backend/app/services/pipeline_service.py backend/tests/test_slicing_service.py backend/tests/test_minmax_client.py docs/examples/api/job-artifacts.json
git commit -m "feat: add slicing and minmax service boundaries"
```

### Task 8: Align Harness Scripts With The Split Apps

**Files:**
- Modify: `scripts/doctor.ps1`
- Modify: `scripts/dev.ps1`
- Modify: `scripts/verify.ps1`
- Modify: `docs/harness/verification.md`

- [ ] **Step 1: Write the failing script presence check**

```powershell
Select-String -Path scripts\dev.ps1 -Pattern 'frontend|backend'
```

Expected: no matches

- [ ] **Step 2: Run the check to verify it fails**

Run: `Select-String -Path scripts\dev.ps1 -Pattern 'frontend|backend'`
Expected: no output

- [ ] **Step 3: Write minimal implementation**

Update the scripts to reflect the split repo.

`scripts/dev.ps1`

```powershell
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Write-Host "Run frontend in one shell:"
Write-Host "  cd $RepoRoot\\frontend; cmd /c npm.cmd run dev"
Write-Host "Run backend in another shell:"
Write-Host "  cd $RepoRoot\\backend; python -m uvicorn app.main:app --reload --port 8000"
```

`scripts/verify.ps1`

```powershell
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Frontend:"
Set-Location (Join-Path $RepoRoot "frontend")
cmd /c npm.cmd test -- --run
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
cmd /c npx.cmd tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
cmd /c npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Backend:"
Set-Location (Join-Path $RepoRoot "backend")
python -m pytest -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Update `docs/harness/verification.md` so it lists the new split verification flow exactly.

- [ ] **Step 4: Run the check to verify it passes**

Run: `Select-String -Path scripts\dev.ps1 -Pattern 'frontend|backend'`
Expected: matches for both `frontend` and `backend`

- [ ] **Step 5: Commit**

```bash
git add scripts/doctor.ps1 scripts/dev.ps1 scripts/verify.ps1 docs/harness/verification.md
git commit -m "chore: align harness scripts with split apps"
```
