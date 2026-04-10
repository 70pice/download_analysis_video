from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

StageStatus = Literal["pending", "running", "complete", "failed"]
JobStatus = Literal["queued", "downloading", "processing", "completed", "failed"]


class StageRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    key: str
    label: str
    status: StageStatus
    error: Optional[str]
    updated_at: str = Field(alias="updatedAt")


class JobRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    source_url: HttpUrl = Field(alias="sourceUrl")
    status: JobStatus
    active_stage: Optional[str] = Field(alias="activeStage")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    stages: list[StageRecord]


class JobDetailResponse(BaseModel):
    job: JobRecord
