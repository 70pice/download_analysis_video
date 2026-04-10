from app.schemas.contracts import JobDetailResponse


def test_job_detail_response_validates_sample_payload() -> None:
    sample = {
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
                    "error": None,
                    "updatedAt": "2026-04-09T12:01:00.000Z",
                }
            ],
        }
    }

    response = JobDetailResponse.model_validate(sample)

    assert response.job.id == "job_001"
    assert str(response.job.source_url) == "https://example.com/video"
    assert response.job.status == "processing"
