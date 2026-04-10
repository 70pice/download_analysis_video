from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["api-v1"])


@router.get("/placeholder")
def placeholder() -> dict[str, str]:
    return {"status": "ok", "message": "backend api v1 scaffold"}
