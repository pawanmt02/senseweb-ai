from typing import Optional
from pydantic import BaseModel, HttpUrl, Field

class CaptionRequest(BaseModel):
    image_url: Optional[HttpUrl] = None
    image_base64: Optional[str] = None
    context: Optional[str] = None
    max_new_tokens: int = Field(default=50, ge=10, le=200)

class CaptionResponse(BaseModel):
    caption: str
    model_used: str
    inference_time_ms: float
