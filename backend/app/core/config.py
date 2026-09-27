import os
from typing import List, Optional
import torch
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SenseWeb AI Backend"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    CORS_ORIGIN_REGEX: str = r"^(chrome-extension|moz-extension)://.*$"
    CAPTION_MODEL_ID: str = "Salesforce/blip-image-captioning-base"
    SUMMARIZE_MODEL_ID: str = "sshleifer/distilbart-cnn-12-6"
    SIMPLIFY_MODEL_ID: str = "google/flan-t5-base"
    
    DEVICE: str = ""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DEVICE:
            if torch.cuda.is_available():
                self.DEVICE = "cuda"
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                self.DEVICE = "mps"
            else:
                self.DEVICE = "cpu"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
