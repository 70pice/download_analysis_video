import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_storage_root(monkeypatch, tmp_path):
    storage_root = tmp_path / "storage" / "jobs"
    monkeypatch.setattr("app.services.job_store.STORAGE_ROOT", storage_root)
    return storage_root


def test_jobs_list_returns_empty_items():
    response = client.get("/api/v1/jobs")

    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_create_job_and_get_job_detail():
    create_response = client.post("/api/v1/jobs", json={"source_url": "https://example.com/video"})

    assert create_response.status_code == 201
    created = create_response.json()["job"]
    assert created["sourceUrl"] == "https://example.com/video"
    assert created["status"] == "queued"

    detail_response = client.get(f"/api/v1/jobs/{created['id']}")

    assert detail_response.status_code == 200
    assert detail_response.json()["job"]["id"] == created["id"]


def test_create_job_enqueues_pipeline(monkeypatch):
    called = {}

    def fake_run_pipeline_job(job_id: str) -> None:
        called["job_id"] = job_id

    monkeypatch.setattr("app.api.routes_jobs.run_pipeline_job", fake_run_pipeline_job)

    response = client.post("/api/v1/jobs", json={"source_url": "https://example.com/video"})

    assert response.status_code == 201
    assert called["job_id"] == response.json()["job"]["id"]


def test_jobs_api_allows_frontend_origin_preflight():
    response = client.options(
        "/api/v1/jobs",
        headers={
            "Origin": "http://127.0.0.1:3000",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:3000"
