from pathlib import Path
from shutil import which
from typing import Any, Callable, Optional

from app.services.download_service import download_video
from app.services import job_store
from app.services.media_inspection import inspect_video
from app.services.minmax_client import MinMaxClient
from app.services.slicing_service import extract_keyframe, slice_video

StageCallable = Callable[..., Any]

STAGE_LABELS = {
    "download_video": "Download video",
    "inspect_video": "Inspect video",
    "slice_video": "Slice video",
    "analyze_clips": "Analyze clips",
    "build_storyboard": "Build storyboard",
    "generate_remix_plan": "Generate remix plan",
}


class PipelineService:
    def __init__(
        self,
        *,
        download_video_fn: StageCallable = download_video,
        inspect_video_fn: StageCallable = inspect_video,
        slice_video_fn: StageCallable = slice_video,
        extract_keyframe_fn: StageCallable = extract_keyframe,
        minmax_client: Optional[MinMaxClient] = None,
    ) -> None:
        self.download_video_fn = download_video_fn
        self.inspect_video_fn = inspect_video_fn
        self.slice_video_fn = slice_video_fn
        self.extract_keyframe_fn = extract_keyframe_fn
        self.minmax_client = minmax_client or MinMaxClient()

    def dependencies_ready(self) -> dict[str, bool]:
        return {
            "download": which("yt-dlp") is not None or which("uv") is not None,
            "inspect": which("ffprobe") is not None,
            "slice": which("ffmpeg") is not None,
            "analyze": True,
        }

    def run_job(self, job_id: str) -> None:
        job = job_store.get_job(job_id)
        if job is None:
            raise FileNotFoundError(f"Job not found: {job_id}")

        try:
            job_store.update_job(job_id, status="processing", activeStage="download_video")
            video_path = self._run_download(job_id, job["sourceUrl"])

            job_store.update_job(job_id, activeStage="inspect_video")
            metadata = self._run_inspection(job_id, video_path)

            job_store.update_job(job_id, activeStage="slice_video")
            clip_path, keyframe_path = self._run_slicing(job_id, video_path, metadata)

            job_store.update_job(job_id, activeStage="analyze_clips")
            clips_payload = self._run_clip_analysis(job_id, clip_path, keyframe_path)

            job_store.update_job(job_id, activeStage="build_storyboard")
            storyboard_payload = self._build_storyboard(job_id, clips_payload)

            job_store.update_job(job_id, activeStage="generate_remix_plan")
            self._build_remix_plan(job_id, clips_payload, storyboard_payload)

            job_store.update_job(job_id, status="completed", activeStage=None)
        except Exception as exc:
            current_job = job_store.get_job(job_id)
            active_stage = None if current_job is None else current_job.get("activeStage")
            if active_stage:
                job_store.upsert_stage(
                    job_id,
                    active_stage,
                    STAGE_LABELS[active_stage],
                    "failed",
                    str(exc),
                )
            job_store.update_job(job_id, status="failed", activeStage=None)
            raise

    def _run_download(self, job_id: str, source_url: str) -> Path:
        job_store.upsert_stage(job_id, "download_video", STAGE_LABELS["download_video"], "running")
        source_dir = job_store.STORAGE_ROOT / job_id / "source"
        video_path = self.download_video_fn(source_url, source_dir)
        job_store.upsert_stage(job_id, "download_video", STAGE_LABELS["download_video"], "complete")
        return Path(video_path)

    def _run_inspection(self, job_id: str, video_path: Path) -> dict:
        job_store.upsert_stage(job_id, "inspect_video", STAGE_LABELS["inspect_video"], "running")
        metadata = self.inspect_video_fn(str(video_path))
        job_store.write_artifact(job_id, "source/metadata.json", metadata)
        job_store.upsert_stage(job_id, "inspect_video", STAGE_LABELS["inspect_video"], "complete")
        return metadata

    def _run_slicing(self, job_id: str, video_path: Path, metadata: dict) -> tuple[Path, Path]:
        job_store.upsert_stage(job_id, "slice_video", STAGE_LABELS["slice_video"], "running")
        duration = self._clip_duration_seconds(metadata)
        clip_path = job_store.STORAGE_ROOT / job_id / "clips" / "clip-001.mp4"
        self.slice_video_fn(str(video_path), str(clip_path), 0, duration)

        keyframe_path = job_store.STORAGE_ROOT / job_id / "frames" / "clip-001.jpg"
        self.extract_keyframe_fn(str(clip_path), str(keyframe_path))
        job_store.upsert_stage(job_id, "slice_video", STAGE_LABELS["slice_video"], "complete")
        return clip_path, keyframe_path

    def _run_clip_analysis(self, job_id: str, clip_path: Path, keyframe_path: Path) -> dict:
        job_store.upsert_stage(job_id, "analyze_clips", STAGE_LABELS["analyze_clips"], "running")
        analysis = self.minmax_client.analyze_clip(str(clip_path), str(keyframe_path))
        clips_payload = {"shots": [analysis]}
        job_store.write_artifact(job_id, "analysis/clips.json", clips_payload)
        job_store.upsert_stage(job_id, "analyze_clips", STAGE_LABELS["analyze_clips"], "complete")
        return clips_payload

    def _build_storyboard(self, job_id: str, clips_payload: dict) -> dict:
        job_store.upsert_stage(job_id, "build_storyboard", STAGE_LABELS["build_storyboard"], "running")
        first_shot = clips_payload["shots"][0]
        storyboard_payload = {
            "summary": first_shot["summary"],
            "shots": [
                {
                    "id": first_shot["clipId"],
                    "summary": first_shot["summary"],
                }
            ],
        }
        job_store.write_artifact(job_id, "analysis/storyboard.json", storyboard_payload)
        job_store.upsert_stage(job_id, "build_storyboard", STAGE_LABELS["build_storyboard"], "complete")
        return storyboard_payload

    def _build_remix_plan(self, job_id: str, clips_payload: dict, storyboard_payload: dict) -> dict:
        job_store.upsert_stage(job_id, "generate_remix_plan", STAGE_LABELS["generate_remix_plan"], "running")
        summary = storyboard_payload["summary"]
        remix_plan_payload = {
            "hooks": [summary],
            "beats": [shot["summary"] for shot in clips_payload["shots"]],
            "cta": summary,
        }
        job_store.write_artifact(job_id, "analysis/remix_plan.json", remix_plan_payload)
        job_store.upsert_stage(job_id, "generate_remix_plan", STAGE_LABELS["generate_remix_plan"], "complete")
        return remix_plan_payload

    def _clip_duration_seconds(self, metadata: dict) -> int:
        duration_value = metadata.get("format", {}).get("duration")
        try:
            duration_seconds = int(float(duration_value))
        except (TypeError, ValueError):
            duration_seconds = 5

        return max(1, min(duration_seconds, 5))
