from pathlib import Path

from app.services.download_service import build_download_command, resolve_download_command


def test_build_download_command() -> None:
    command = build_download_command(
        "https://example.com/video",
        "storage/jobs/job_001/source",
    )

    assert command == [
        "yt-dlp",
        "-o",
        str(Path("storage/jobs/job_001/source") / "original.%(ext)s"),
        "https://example.com/video",
    ]


def test_resolve_download_command_uses_uv_when_ytdlp_missing(monkeypatch) -> None:
    monkeypatch.setattr("app.services.download_service.which", lambda name: "uv" if name == "uv" else None)

    command = resolve_download_command(build_download_command("https://example.com/video", "storage/jobs/job_001/source"))

    assert command[:4] == ["uv", "run", "--with", "yt-dlp"]
