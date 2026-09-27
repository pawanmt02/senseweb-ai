from fastapi import APIRouter, HTTPException
from app.schemas.simplify import SimplifyRequest, SimplifyResponse
from app.services.simplify_service import simplify_service

router = APIRouter()

@router.post("", response_model=SimplifyResponse)
def simplify_text(request: SimplifyRequest):
    """
    Simplify or summarize a block of text.
    """
    try:
        result, model_used, inference_time = simplify_service.process(
            text=request.text_block,
            mode=request.mode,
            min_len=request.min_length,
            max_len=request.max_length
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to process text: {str(e)}")
        
    return SimplifyResponse(
        result_text=result,
        original_length=len(request.text_block),
        result_length=len(result),
        mode=request.mode,
        model_used=model_used,
        inference_time_ms=inference_time
    )
