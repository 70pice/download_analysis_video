import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from app.core.paths import STORAGE_ROOT


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _job_path(job_id: str):
    return STORAGE_ROOT / job_id / "job.json"


def _write_job(job: dict) -> dict:
    job["updatedAt"] = _timestamp()
    job_path = _job_path(job["id"])
    job_path.parent.mkdir(parents=True, exist_ok=True)
    job_path.write_text(json.dumps(job, indent=2), encoding="utf-8")
    return job


def create_job(source_url: str) -> dict:
    job_id = f"job_{uuid4().hex[:12]}"
    created_at = _timestamp()
    job = {
        "id": job_id,
        "sourceUrl": source_url,
        "status": "queued",
        "activeStage": None,
        "createdAt": created_at,
        "updatedAt": created_at,
        "stages": [],
    }
    return _write_job(job)


def list_jobs() -> list[dict]:
    if not STORAGE_ROOT.exists():
        return []

    jobs = []
    for job_path in STORAGE_ROOT.glob("*/job.json"):
        jobs.append(json.loads(job_path.read_text(encoding="utf-8")))

    return sorted(jobs, key=lambda job: job["createdAt"], reverse=True)


def get_job(job_id: str) -> Optional[dict]:
    job_path = _job_path(job_id)
    if not job_path.exists():
        return None

    return json.loads(job_path.read_text(encoding="utf-8"))


def update_job(job_id: str, **changes: Any) -> dict:
    job = get_job(job_id)
    if job is None:
        raise FileNotFoundError(f"Job not found: {job_id}")

    job.update(changes)
    return _write_job(job)


def upsert_stage(job_id: str, key: str, label: str, status: str, error: Optional[str] = None) -> dict:
    job = get_job(job_id)
    if job is None:
        raise FileNotFoundError(f"Job not found: {job_id}")

    stages = job.setdefault("stages", [])
    updated_at = _timestamp()
    for stage in stages:
        if stage["key"] == key:
            stage.update(
                {
                    "label": label,
                    "status": status,
                    "error": error,
                    "updatedAt": updated_at,
                }
            )
            break
    else:
        stages.append(
            {
                "key": key,
                "label": label,
                "status": status,
                "error": error,
                "updatedAt": updated_at,
            }
        )

    job["updatedAt"] = updated_at
    return _write_job(job)


def write_artifact(job_id: str, relative_path: str, payload: Any) -> Path:
    artifact_path = STORAGE_ROOT / job_id / relative_path
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    artifact_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return artifact_path


def read_artifact(job_id: str, relative_path: str) -> Optional[Any]:
    artifact_path = STORAGE_ROOT / job_id / relative_path
    if not artifact_path.exists():
        return None

    return json.loads(artifact_path.read_text(encoding="utf-8"))
