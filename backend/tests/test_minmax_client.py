from app.services.minmax_client import MinMaxClient


def test_analyze_clip_returns_stub_payload() -> None:
    client = MinMaxClient()

    result = client.analyze_clip("clip-001.mp4")

    assert result["clipId"] == "clip-001.mp4"
    assert result["summary"] == "stub analysis"
