import os
import shutil
import uuid
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.core.db import engine
from app.models import News, NewsImage
from app.schemas import Message, NewsImageList, NewsImagePublic
from sqlmodel import Session

router = APIRouter(prefix="/news/{news_id}/images", tags=["images"])

public_router = APIRouter(prefix="/news/{news_id}/images", tags=["images"])

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
if not UPLOAD_DIR.is_absolute():
    base_dir = Path(__file__).parent.parent.parent.parent
    if base_dir.name == "app" and base_dir.parent.name == "app":
        base_dir = base_dir.parent
    UPLOAD_DIR = base_dir / UPLOAD_DIR
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_upload_path(news_id: uuid.UUID) -> Path:
    """Get upload directory for specific news item."""
    news_dir = UPLOAD_DIR / "news" / str(news_id)
    news_dir.mkdir(parents=True, exist_ok=True)
    return news_dir


def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file."""
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}",
        )


def save_image(file: UploadFile, news_id: uuid.UUID) -> tuple[str, int]:
    """
    Save uploaded image, normalize to JPEG format and standard size.
    Returns relative path and file size.
    """
    validate_image(file)
    
    unique_id = uuid.uuid4()
    file_name = f"{unique_id}.jpg"
    upload_path = get_upload_path(news_id)
    file_path = upload_path / file_name
    
    temp_path = upload_path / f"{unique_id}_temp{Path(file.filename).suffix}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    temp_size = temp_path.stat().st_size
    if temp_size > settings.MAX_UPLOAD_SIZE:
        temp_path.unlink()
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB",
        )
    
    try:
        with Image.open(temp_path) as img:
            if img.mode != "RGB":
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                if img.mode in ("RGBA", "LA"):
                    rgb_img.paste(img, mask=img.split()[-1])
                else:
                    rgb_img = img.convert("RGB")
                img = rgb_img
            
            MAX_WIDTH = 1920
            MAX_HEIGHT = 1080
            
            if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
                ratio = min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
                quality = 80
            else:
                quality = 85
            
            img.save(file_path, "JPEG", quality=quality, optimize=True)
            
    except Exception as e:
        try:
            with Image.open(temp_path) as img:
                img.convert("RGB").save(file_path, "JPEG", quality=85)
        except Exception:
            if temp_path.exists():
                temp_path.unlink()
            raise HTTPException(
                status_code=400,
                detail=f"Failed to process image: {str(e)}"
            )
    finally:
        if temp_path.exists() and temp_path != file_path:
            temp_path.unlink()
    
    file_size = file_path.stat().st_size
    
    relative_path = f"news/{news_id}/{file_name}"
    return relative_path, file_size


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
    
    file_path, file_size = save_image(file, news_id)
    
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
        
        file_path = UPLOAD_DIR / image.file_path
        
        possible_paths = [
            file_path,
            file_path.with_suffix(".jpg"),
        ]
        
        news_dir = get_upload_path(news_id)
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
    
    file_path = UPLOAD_DIR / image.file_path
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

