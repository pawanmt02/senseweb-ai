from fastapi import APIRouter
from app.api.v1.endpoints import caption, simplify, profile

api_router = APIRouter()
api_router.include_router(caption.router, prefix="/caption", tags=["Vision"])
api_router.include_router(simplify.router, prefix="/simplify", tags=["NLP"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profiles"])
