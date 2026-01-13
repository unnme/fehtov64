import uuid
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import select, Session

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.core.db import engine
from app.models import News, NewsImage
from app.schemas import Message, NewsImageList, NewsImagePublic
from app.services.image_service import image_service

router = APIRouter(prefix="/news/{news_id}/images", tags=["images"])

public_router = APIRouter(prefix="/news/{news_id}/images", tags=["images"])


@router.post("/", response_model=NewsImagePublic)
async def upload_image(
    news_id: uuid.UUID,
    file: Annotated[UploadFile, File()],
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Upload an image for a news item."""
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    if not current_user.is_superuser and news.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    statement = select(NewsImage).where(NewsImage.news_id == news_id)
    existing_images = session.exec(statement).all()
    max_order = max([img.order for img in existing_images], default=-1)
    is_first_image = len(existing_images) == 0
    
    file_path, file_size = image_service.save_image(file, news_id)
    
    file_ext = Path(file_path).suffix.lower()
    mime_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    mime_type = mime_type_map.get(file_ext, file.content_type or "image/jpeg")
    
    image = NewsImage(
        news_id=news_id,
        file_name=file.filename or "image",
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        order=max_order + 1,
        is_main=is_first_image,
    )
    session.add(image)
    session.commit()
    session.refresh(image)
    
    return image


@router.get("/", response_model=NewsImageList)
def get_images(
    news_id: uuid.UUID,
    session: SessionDep,
) -> Any:
    """Get all images for a news item."""
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    statement = (
        select(NewsImage)
        .where(NewsImage.news_id == news_id)
        .order_by(NewsImage.is_main.desc(), NewsImage.order)
    )
    images = session.exec(statement).all()
    count = len(images)
    
    return NewsImageList(data=images, count=count)


@public_router.get("/{image_id}/file")
def get_image_file(
    news_id: uuid.UUID,
    image_id: uuid.UUID,
) -> FileResponse:
    """
    Get image file.
    Public endpoint - no authentication required as images are part of public news.
    """
    with Session(engine) as session:
        news = session.get(News, news_id)
        if not news:
            raise HTTPException(status_code=404, detail="News not found")
        
        image = session.get(NewsImage, image_id)
        if not image or image.news_id != news_id:
            raise HTTPException(status_code=404, detail="Image not found")
        
        upload_dir = image_service.UPLOAD_DIR
        file_path = upload_dir / image.file_path
        
        possible_paths = [
            file_path,
            file_path.with_suffix(".jpg"),
        ]
        
        news_dir = image_service.get_upload_path(news_id)
        file_name = Path(image.file_path).name
        possible_paths.append(news_dir / file_name)
        
        jpg_name = Path(file_name).stem + ".jpg"
        possible_paths.append(news_dir / jpg_name)
        
        png_name = Path(file_name).stem + ".png"
        possible_paths.append(news_dir / png_name)
        
        found_path = None
        for path in possible_paths:
            if path.exists() and path.is_file():
                found_path = path
                break
        
        if not found_path:
            raise HTTPException(
                status_code=404,
                detail=f"Image file not found. Checked paths: {[str(p) for p in possible_paths[:3]]}"
            )
        
        file_path = found_path
        
        return FileResponse(
            path=str(file_path),
            media_type=image.mime_type,
            filename=image.file_name,
        )


@router.delete("/{image_id}")
def delete_image(
    news_id: uuid.UUID,
    image_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """Delete an image."""
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    if not current_user.is_superuser and news.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    image = session.get(NewsImage, image_id)
    if not image or image.news_id != news_id:
        raise HTTPException(status_code=404, detail="Image not found")
    
    file_path = image_service.UPLOAD_DIR / image.file_path
    if file_path.exists():
        file_path.unlink()
    
    session.delete(image)
    session.commit()
    
    return Message(message="Image deleted successfully")


@router.put("/{image_id}/reorder")
def reorder_image(
    news_id: uuid.UUID,
    image_id: uuid.UUID,
    new_order: int,
    session: SessionDep,
    current_user: CurrentUser,
) -> NewsImagePublic:
    """Change image order."""
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    if not current_user.is_superuser and news.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    image = session.get(NewsImage, image_id)
    if not image or image.news_id != news_id:
        raise HTTPException(status_code=404, detail="Image not found")
    
    statement = select(NewsImage).where(NewsImage.news_id == news_id)
    all_images = session.exec(statement).all()
    
    if new_order < 0 or new_order >= len(all_images):
        raise HTTPException(status_code=400, detail="Invalid order")
    
    old_order = image.order
    if new_order > old_order:
        for img in all_images:
            if old_order < img.order <= new_order:
                img.order -= 1
    elif new_order < old_order:
        for img in all_images:
            if new_order <= img.order < old_order:
                img.order += 1
    
    image.order = new_order
    session.add(image)
    session.flush()
    
    for img in all_images:
        img.is_main = False
    
    updated_images = session.exec(select(NewsImage).where(NewsImage.news_id == news_id)).all()
    first_image = next((img for img in updated_images if img.order == 0), None)
    if first_image:
        first_image.is_main = True
        session.add(first_image)
    
    session.commit()
    session.refresh(image)
    
    return image


@router.put("/{image_id}/set-main", response_model=NewsImagePublic)
def set_main_image(
    news_id: uuid.UUID,
    image_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> NewsImagePublic:
    """Set image as main (for preview)."""
    news = session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    if not current_user.is_superuser and news.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    image = session.get(NewsImage, image_id)
    if not image or image.news_id != news_id:
        raise HTTPException(status_code=404, detail="Image not found")
    
    statement = select(NewsImage).where(NewsImage.news_id == news_id)
    all_images = session.exec(statement).all()
    for img in all_images:
        if img.id != image_id:
            img.is_main = False
    
    image.is_main = True
    session.add(image)
    session.commit()
    session.refresh(image)
    
    return image

