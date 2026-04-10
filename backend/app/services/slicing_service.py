from pathlib import Path
import subprocess


def build_slice_command(
    input_path: str,
    output_path: str,
    start_seconds: int,
    end_seconds: int,
) -> list[str]:
    return [
        "ffmpeg",
        "-y",
        "-i",
        input_path,
        "-ss",
        str(start_seconds),
        "-to",
        str(end_seconds),
        output_path,
    ]


def slice_video(input_path: str, output_path: str, start_seconds: int, end_seconds: int) -> Path:
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        build_slice_command(input_path, output_path, start_seconds, end_seconds),
        check=True,
        capture_output=True,
        text=True,
    )
    return output_file


def extract_keyframe(clip_path: str, output_path: str) -> Path:
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            clip_path,
            "-frames:v",
            "1",
            output_path,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return output_file
