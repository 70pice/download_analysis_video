import json
from pathlib import Path
from typing import Optional

from app.services.job_store import create_job, get_job
from app.services.pipeline_service import PipelineService


def test_run_job_writes_artifacts_and_completes(monkeypatch, tmp_path):
    storage_root = tmp_path / "storage" / "jobs"
    monkeypatch.setattr("app.services.job_store.STORAGE_ROOT", storage_root)

    job = create_job("https://example.com/video")

    def fake_download(source_url: str, output_dir: Path) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)
        video_path = output_dir / "original.mp4"
        video_path.write_bytes(b"video")
        return video_path

    def fake_inspect(video_path: str) -> dict:
        return {
            "format": {
                "filename": video_path,
                "duration": "12.5",
            }
        }

    def fake_slice(input_path: str, output_path: str, start_seconds: int, end_seconds: int) -> Path:
        clip_path = Path(output_path)
        clip_path.parent.mkdir(parents=True, exist_ok=True)
        clip_path.write_bytes(b"clip")
        return clip_path

    def fake_keyframe(clip_path: str, output_path: str) -> Path:
        frame_path = Path(output_path)
        frame_path.parent.mkdir(parents=True, exist_ok=True)
        frame_path.write_bytes(b"frame")
        return frame_path

    class FakeMinMaxClient:
        def analyze_clip(self, clip_path: str, keyframe_path: Optional[str] = None) -> dict:
            return {
                "clipId": Path(clip_path).stem,
                "summary": "opening shot",
                "people": [],
                "scene": "interior",
                "blocking": "static",
                "camera": "wide",
                "dialogue": "",
                "tags": ["intro"],
                "confidence": 0.8,
                "keyframePath": keyframe_path,
            }

    service = PipelineService(
        download_video_fn=fake_download,
        inspect_video_fn=fake_inspect,
        slice_video_fn=fake_slice,
        extract_keyframe_fn=fake_keyframe,
        minmax_client=FakeMinMaxClient(),
    )

    service.run_job(job["id"])

    stored_job = get_job(job["id"])
    assert stored_job is not None
    assert stored_job["status"] == "completed"
    assert stored_job["activeStage"] is None
    assert [stage["key"] for stage in stored_job["stages"]] == [
        "download_video",
        "inspect_video",
        "slice_video",
        "analyze_clips",
        "build_storyboard",
        "generate_remix_plan",
    ]
    assert all(stage["status"] == "complete" for stage in stored_job["stages"])

    metadata_path = storage_root / job["id"] / "source" / "metadata.json"
    clips_path = storage_root / job["id"] / "analysis" / "clips.json"
    storyboard_path = storage_root / job["id"] / "analysis" / "storyboard.json"
    remix_plan_path = storage_root / job["id"] / "analysis" / "remix_plan.json"

    assert json.loads(metadata_path.read_text(encoding="utf-8"))["format"]["duration"] == "12.5"
    assert json.loads(clips_path.read_text(encoding="utf-8"))["shots"][0]["summary"] == "opening shot"
    assert json.loads(storyboard_path.read_text(encoding="utf-8"))["summary"] == "opening shot"
    assert json.loads(remix_plan_path.read_text(encoding="utf-8"))["hooks"] == ["opening shot"]
