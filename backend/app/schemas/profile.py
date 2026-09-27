from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ProfileResponse(BaseModel):
    user_id: str
    profiles: Dict[str, Any] = Field(
        default_factory=lambda: {
            "bionic_reading": {"enabled": False},
            "focus_mode": {"enabled": False},
            "high_contrast": {"enabled": False},
            "dyslexia_friendly": {"enabled": False},
            "large_text": {"enabled": False},
            "reduced_motion": {"enabled": False},
            "skip_navigation": {"enabled": False},
            "focus_indicators": {"enabled": False}
        }
    )
    active_profile: Optional[str] = None
