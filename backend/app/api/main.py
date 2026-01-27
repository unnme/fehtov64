"""Main API router combining all route modules."""
from fastapi import APIRouter

from app.api.routes import (
    auth,
    documents,
    images,
    news,
    organization_card,
    person_images,
    persons,
    positions,
    users,
    utils,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(positions.router)
api_router.include_router(persons.router)
api_router.include_router(person_images.router)
api_router.include_router(person_images.public_router)
api_router.include_router(utils.router)
api_router.include_router(news.router)
api_router.include_router(news.public_router)
api_router.include_router(images.router)
api_router.include_router(images.public_router)
api_router.include_router(organization_card.public_router)
api_router.include_router(organization_card.router)
api_router.include_router(documents.public_router)
api_router.include_router(documents.router)
