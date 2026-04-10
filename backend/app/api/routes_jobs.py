from pydantic import BaseModel, HttpUrl
from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.schemas.contracts import JobDetailResponse
from app.services.job_store import create_job, get_job, list_jobs, read_artifact
from app.services.pipeline_service import PipelineService

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])
pipeline_service = PipelineService()


def run_pipeline_job(job_id: str) -> None:
    try:
        pipeline_service.run_job(job_id)
    except Exception:
        # The pipeline persists failure state onto the job record.
        return


@router.get("")
def get_jobs() -> dict[str, list[dict]]:
    return {"items": list_jobs()}


class CreateJobRequest(BaseModel):
    source_url: HttpUrl


@router.post("", status_code=status.HTTP_201_CREATED)
def post_job(payload: CreateJobRequest, background_tasks: BackgroundTasks) -> JobDetailResponse:
    job = create_job(str(payload.source_url))
    background_tasks.add_task(run_pipeline_job, job["id"])
    return JobDetailResponse.model_validate({"job": job})


@router.get("/{job_id}")
def get_job_detail(job_id: str) -> JobDetailResponse:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobDetailResponse.model_validate({"job": job})


@router.get("/{job_id}/artifacts")
def get_job_artifacts(job_id: str) -> dict:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    artifacts = {
        "metadata": read_artifact(job_id, "source/metadata.json"),
        "clips": read_artifact(job_id, "analysis/clips.json"),
        "storyboard": read_artifact(job_id, "analysis/storyboard.json"),
        "remixPlan": read_artifact(job_id, "analysis/remix_plan.json"),
    }
    return artifacts
