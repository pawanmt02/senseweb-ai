from fastapi import APIRouter, HTTPException
from app.schemas.caption import CaptionRequest, CaptionResponse
from app.services.caption_service import caption_service

router = APIRouter()

@router.post("", response_model=CaptionResponse)
def caption_image(request: CaptionRequest):
    """
    Generate a caption for an image provided via URL or base64.
    """
    if not request.image_url and not request.image_base64:
        raise HTTPException(status_code=400, detail="Either image_url or image_base64 must be provided")
        
    try:
        image = caption_service.decode_image(request.image_url, request.image_base64)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to decode image: {str(e)}")
        
    try:
        caption, inference_time = caption_service.generate_caption(
            image, 
            context=request.context, 
            max_new_tokens=request.max_new_tokens
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to process image: {str(e)}")
        
    return CaptionResponse(
        caption=caption,
        model_used=caption_service.model.config._name_or_path if caption_service.model else "unknown",
        inference_time_ms=inference_time
    )
