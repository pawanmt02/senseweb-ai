from fastapi import APIRouter
from app.schemas.profile import ProfileResponse

router = APIRouter()

@router.get("", response_model=ProfileResponse)
def get_profile(user_id: str):
    """
    Get the profile settings for a user.
    This is a stub, actual profile storage will be client-side.
    """
    return ProfileResponse(user_id=user_id)
