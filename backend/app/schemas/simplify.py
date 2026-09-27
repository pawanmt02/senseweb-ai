from typing import Literal
from pydantic import BaseModel, Field

class SimplifyRequest(BaseModel):
    text_block: str = Field(min_length=10, max_length=15000)
    mode: Literal['summarize', 'simplify'] = 'simplify'
    min_length: int = 30
    max_length: int = 150

class SimplifyResponse(BaseModel):
    result_text: str
    original_length: int
    result_length: int
    mode: str
    model_used: str
    inference_time_ms: float
