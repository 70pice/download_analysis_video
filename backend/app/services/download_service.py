from pathlib import Path
import subprocess
from shutil import which


def build_download_command(source_url: str, output_dir: str) -> list[str]:
    output_template = str(Path(output_dir) / "original.%(ext)s")
    return ["yt-dlp", "-o", output_template, source_url]


def resolve_download_command(command: list[str]) -> list[str]:
    if which("yt-dlp") is not None:
        return command

    if which("uv") is not None:
        return ["uv", "run", "--with", "yt-dlp", *command]

    return command


def download_video(source_url: str, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        resolve_download_command(build_download_command(source_url, str(output_dir))),
        check=True,
        capture_output=True,
        text=True,
    )

    matches = sorted(output_dir.glob("original.*"))
    if not matches:
        raise FileNotFoundError(f"Downloaded file not found in {output_dir}")

    return matches[0]
