"""Main API router combining all route modules."""
from fastapi import APIRouter

from app.api.routes import auth, documents, images, news, users, utils

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(news.router)
api_router.include_router(news.public_router)
api_router.include_router(images.router)
api_router.include_router(images.public_router)
api_router.include_router(documents.router)
api_router.include_router(documents.public_router)
