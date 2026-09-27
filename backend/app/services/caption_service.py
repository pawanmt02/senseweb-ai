import time
import base64
import io
import httpx
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
from app.core.config import settings

class CaptionService:
    """Service to handle image captioning using BLIP model."""
    
    def __init__(self):
        self.device = settings.DEVICE
        self.processor = None
        self.model = None

    def load_model(self):
        """Loads the BLIP processor and model from the configured model ID."""
        print(f"Loading caption model {settings.CAPTION_MODEL_ID} on {self.device}...")
        self.processor = BlipProcessor.from_pretrained(settings.CAPTION_MODEL_ID)
        self.model = BlipForConditionalGeneration.from_pretrained(settings.CAPTION_MODEL_ID).to(self.device)

    def decode_image(self, image_url: str = None, image_base64: str = None) -> Image.Image:
        """Decodes an image from a URL or base64 string into a PIL Image."""
        if image_url:
            response = httpx.get(
                str(image_url),
                follow_redirects=True,
                timeout=30.0,
                headers={"User-Agent": "SenseWeb-AI/1.0 (+local accessibility tool)"},
            )
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content)).convert('RGB')
            return image
        elif image_base64:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
            return image
        raise ValueError("Either image_url or image_base64 must be provided")

    def generate_caption(self, image: Image.Image, context: str = None, max_new_tokens: int = 50) -> tuple[str, float]:
        """Generates a caption for the given image, optionally using text context."""
        start_time = time.time()
        
        text = context if context else None
        
        inputs = self.processor(image, text=text, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            out = self.model.generate(**inputs, max_new_tokens=max_new_tokens)
            
        caption = self.processor.decode(out[0], skip_special_tokens=True)
        
        inference_time_ms = (time.time() - start_time) * 1000
        return caption, inference_time_ms

caption_service = CaptionService()
