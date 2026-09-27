import time
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from app.core.config import settings

class SimplifyService:
    """Service to handle text simplification and summarization."""
    
    def __init__(self):
        self.device = settings.DEVICE
        self.summarize_tokenizer = None
        self.summarize_model = None
        self.simplify_tokenizer = None
        self.simplify_model = None

    def load_models(self):
        """Loads both summarization and simplification models."""
        print(f"Loading simplify models on {self.device}...")
        
        # Load Summarizer
        self.summarize_tokenizer = AutoTokenizer.from_pretrained(settings.SUMMARIZE_MODEL_ID)
        self.summarize_model = AutoModelForSeq2SeqLM.from_pretrained(settings.SUMMARIZE_MODEL_ID).to(self.device)
        
        # Load Simplifier
        self.simplify_tokenizer = AutoTokenizer.from_pretrained(settings.SIMPLIFY_MODEL_ID)
        self.simplify_model = AutoModelForSeq2SeqLM.from_pretrained(settings.SIMPLIFY_MODEL_ID).to(self.device)

    def summarize(self, text: str, min_len: int, max_len: int) -> tuple[str, str, float]:
        """Summarizes the input text."""
        start_time = time.time()
        
        inputs = self.summarize_tokenizer(text, return_tensors="pt", max_length=1024, truncation=True).to(self.device)
        with torch.no_grad():
            outputs = self.summarize_model.generate(
                **inputs,
                min_length=min_len,
                max_length=max_len
            )
        result = self.summarize_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        inference_time_ms = (time.time() - start_time) * 1000
        return result, settings.SUMMARIZE_MODEL_ID, inference_time_ms

    def simplify(self, text: str, min_len: int, max_len: int) -> tuple[str, str, float]:
        """Simplifies the input text."""
        start_time = time.time()
        
        prompt = f"Simplify the following text so it is easy to understand: {text}"
        inputs = self.simplify_tokenizer(prompt, return_tensors="pt", max_length=1024, truncation=True).to(self.device)
        with torch.no_grad():
            outputs = self.simplify_model.generate(
                **inputs,
                min_length=min_len,
                max_length=max_len
            )
        result = self.simplify_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        inference_time_ms = (time.time() - start_time) * 1000
        return result, settings.SIMPLIFY_MODEL_ID, inference_time_ms

    def process(self, text: str, mode: str, min_len: int, max_len: int) -> tuple[str, str, float]:
        """Dispatches text processing to either summarize or simplify based on mode."""
        if mode == 'summarize':
            return self.summarize(text, min_len, max_len)
        elif mode == 'simplify':
            return self.simplify(text, min_len, max_len)
        else:
            raise ValueError(f"Invalid mode: {mode}")

simplify_service = SimplifyService()
