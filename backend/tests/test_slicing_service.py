from app.services.slicing_service import build_slice_command


def test_build_slice_command() -> None:
    command = build_slice_command("input.mp4", "clip-001.mp4", 0, 5)

    assert command[0] == "ffmpeg"
    assert "-ss" in command
    assert "-to" in command
