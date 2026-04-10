from app.services.job_store import create_job, list_jobs


def test_create_and_list_job(monkeypatch, tmp_path):
    storage_root = tmp_path / "storage" / "jobs"
    monkeypatch.setattr("app.services.job_store.STORAGE_ROOT", storage_root)

    job = create_job("https://example.com/video")
    items = list_jobs()

    assert items[0]["id"] == job["id"]
    assert items[0]["sourceUrl"] == "https://example.com/video"
