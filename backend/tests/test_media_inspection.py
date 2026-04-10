import json
from types import SimpleNamespace

from app.services.media_inspection import inspect_video


def test_inspect_video_returns_parsed_json(monkeypatch) -> None:
    calls = {}

    def fake_run(command, capture_output, text, check):
        calls["command"] = command
        calls["capture_output"] = capture_output
        calls["text"] = text
        calls["check"] = check
        return SimpleNamespace(stdout=json.dumps({"format": {"filename": "video.mp4"}}))

    monkeypatch.setattr("app.services.media_inspection.subprocess.run", fake_run)

    result = inspect_video("video.mp4")

    assert calls["command"] == [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        "video.mp4",
    ]
    assert result == {"format": {"filename": "video.mp4"}}
