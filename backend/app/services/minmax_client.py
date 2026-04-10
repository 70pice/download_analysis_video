import os
from pathlib import Path
from typing import Optional


class MinMaxClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("MINMAX_API_KEY")

    def analyze_clip(self, clip_path: str, keyframe_path: Optional[str] = None) -> dict:
        clip_id = Path(clip_path).name

        return {
            "clipId": clip_id,
            "summary": "stub analysis",
            "people": [],
            "scene": "unknown",
            "blocking": "unknown",
            "camera": "unknown",
            "dialogue": "",
            "tags": [],
            "confidence": 0.0,
            "keyframePath": keyframe_path,
            "provider": "stub",
        }
