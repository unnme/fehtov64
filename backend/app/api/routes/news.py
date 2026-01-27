import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.models import News, NewsImage
from app.repositories.news_repository import create_news as create_news_repo
from app.schemas import (
    Message,
    NewsCreate,
    NewsPublic,
    NewsPublicList,
    NewsUpdate,
    UserPublic,
)

router = APIRouter(prefix="/news", tags=["news"])

public_router = APIRouter(prefix="/news", tags=["news"])


@public_router.get("/public", response_model=NewsPublicList)
def read_public_news(
    skip: int = 0, limit: int = 10
) -> Any:
    """
    Retrieve published news. Public endpoint - no authentication required.
    """
    from app.core.db import engine
    from sqlmodel import Session
    
    with Session(engine) as session:
        count_statement = select(func.count()).select_from(News).where(News.is_published == True)
        count = session.exec(count_statement).one()
        
        statement = (
            select(News)
            .where(News.is_published == True)
            .order_by(News.published_at.desc().nulls_last(), News.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        news_list = session.exec(statement).all()
        
        from app.models import User
        from app.core.config import settings as app_settings
        from app.schemas import NewsImagePublic
        
        # Build news list with owner and images
        news_public_list = []
        for news_item in news_list:
            # Load owner and convert to UserPublic
            owner_public = None
            if news_item.owner_id:
                owner = session.get(User, news_item.owner_id)
                if owner:
                    owner_dict = owner.model_dump()
                    owner_dict["is_first_superuser"] = owner.email == app_settings.FIRST_SUPERUSER
                    owner_public = UserPublic.model_validate(owner_dict)
            
            # Load images
            images = []
            try:
                images_statement = (
                    select(NewsImage)
                    .where(NewsImage.news_id == news_item.id)
                    .order_by(NewsImage.order)
                )
                images = session.exec(images_statement).all()
            except Exception:
                images = []
            
            # Create NewsPublic object
            news_public = NewsPublic(
                id=news_item.id,
                title=news_item.title,
                content=news_item.content,
                is_published=news_item.is_published,
                owner_id=news_item.owner_id,
                owner=owner_public,
                published_at=news_item.published_at,
                created_at=news_item.created_at,
                updated_at=news_item.updated_at,
                images=[NewsImagePublic.model_validate(img.model_dump()) for img in images] if images else None,
            )
            news_public_list.append(news_public)
            
        return NewsPublicList(data=news_public_list, count=count)


@public_router.get("/public/{id}", response_model=NewsPublic)
def read_public_news_item(id: uuid.UUID) -> Any:
    """
    Get published news by ID. Public endpoint - no authentication required.
    """
    from app.core.db import engine
    from sqlmodel import Session

    with Session(engine) as session:
        statement = select(News).where(
            News.id == id,
            News.is_published == True,
        )
        news_item = session.exec(statement).first()
        if not news_item:
            raise HTTPException(status_code=404, detail="News not found")

        from app.models import User
        from app.core.config import settings as app_settings
        from app.schemas import NewsImagePublic

        owner_public = None
        if news_item.owner_id:
            owner = session.get(User, news_item.owner_id)
            if owner:
                owner_dict = owner.model_dump()
                owner_dict["is_first_superuser"] = owner.email == app_settings.FIRST_SUPERUSER
                owner_public = UserPublic.model_validate(owner_dict)

        images = []
        try:
            images_statement = (
                select(NewsImage)
                .where(NewsImage.news_id == news_item.id)
                .order_by(NewsImage.order)
            )
            images = session.exec(images_statement).all()
        except Exception:
            images = []

        return NewsPublic(
            id=news_item.id,
            title=news_item.title,
            content=news_item.content,
            is_published=news_item.is_published,
            owner_id=news_item.owner_id,
            owner=owner_public,
            published_at=news_item.published_at,
            created_at=news_item.created_at,
            updated_at=news_item.updated_at,
            images=[NewsImagePublic.model_validate(img.model_dump()) for img in images] if images else None,
        )


@router.get("/", response_model=NewsPublicList)
def read_news(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve news. All users can see all news.
    """
    count_statement = select(func.count()).select_from(News)
    count = session.exec(count_statement).one()
    statement = (
        select(News)
        .order_by(News.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    news_list = session.exec(statement).all()
    
    from app.models import User
    from app.schemas import NewsImagePublic
    
    # Build news list with owner and images
    news_public_list = []
    for news_item in news_list:
        # Load owner and convert to UserPublic
        owner_public = None
        if news_item.owner_id:
            owner = session.get(User, news_item.owner_id)
            if owner:
                owner_dict = owner.model_dump()
                owner_dict["is_first_superuser"] = owner.email == settings.FIRST_SUPERUSER
                owner_public = UserPublic.model_validate(owner_dict)
        
        # Load images
        images = []
        try:
            images_statement = (
                select(NewsImage)
                .where(NewsImage.news_id == news_item.id)
                .order_by(NewsImage.order)
            )
            images = session.exec(images_statement).all()
        except Exception:
            images = []
        
        # Create NewsPublic object
        news_public = NewsPublic(
            id=news_item.id,
            title=news_item.title,
            content=news_item.content,
            is_published=news_item.is_published,
            owner_id=news_item.owner_id,
            owner=owner_public,
            published_at=news_item.published_at,
            created_at=news_item.created_at,
            updated_at=news_item.updated_at,
            images=[NewsImagePublic.model_validate(img.model_dump()) for img in images] if images else None,
        )
        news_public_list.append(news_public)
    
    return NewsPublicList(data=news_public_list, count=count)


@router.get("/{id}", response_model=NewsPublic)
def read_news_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get news by ID. All users can read all news.
    """
    news_item = session.get(News, id)
    if not news_item:
        raise HTTPException(status_code=404, detail="News not found")
    
    # Load owner and convert to UserPublic
    from app.models import User
    from app.schemas import NewsImagePublic
    
    owner_public = None
    if news_item.owner_id:
        owner = session.get(User, news_item.owner_id)
        if owner:
            owner_dict = owner.model_dump()
            owner_dict["is_first_superuser"] = owner.email == settings.FIRST_SUPERUSER
            owner_public = UserPublic.model_validate(owner_dict)
    
    # Load images
    images = []
    try:
        images_statement = (
            select(NewsImage)
            .where(NewsImage.news_id == news_item.id)
            .order_by(NewsImage.order)
        )
        images = session.exec(images_statement).all()
    except Exception:
        images = []
    
    # Create NewsPublic object
    return NewsPublic(
        id=news_item.id,
        title=news_item.title,
        content=news_item.content,
        is_published=news_item.is_published,
        owner_id=news_item.owner_id,
        owner=owner_public,
        published_at=news_item.published_at,
        created_at=news_item.created_at,
        updated_at=news_item.updated_at,
        images=[NewsImagePublic.model_validate(img.model_dump()) for img in images] if images else None,
    )


@router.post("/", response_model=NewsPublic)
def create_news(
    *, session: SessionDep, current_user: CurrentUser, news_in: NewsCreate
) -> Any:
    """
    Create new news.
    """
    news = create_news_repo(
        session=session, news_in=news_in, owner_id=current_user.id
    )
    return news


@router.put("/{id}", response_model=NewsPublic)
def update_news(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    news_in: NewsUpdate,
) -> Any:
    """
    Update news. Regular users can only update their own news, superusers can update any.
    """
    news = session.get(News, id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    if not current_user.is_superuser and news.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_dict = news_in.model_dump(exclude_unset=True)
    now = datetime.now(timezone.utc)

    # Only superusers can change owner
    # Check if owner_id is explicitly provided (even if None)
    if hasattr(news_in, 'owner_id') and news_in.owner_id is not None:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Only superusers can change news owner")
        # Validate that the new owner exists
        from app.models import User
        new_owner = session.get(User, news_in.owner_id)
        if not new_owner:
            raise HTTPException(status_code=404, detail="Owner user not found")
        update_dict["owner_id"] = news_in.owner_id

    if "is_published" in update_dict:
        if update_dict["is_published"] and not news.published_at:
            update_dict["published_at"] = now
        elif not update_dict["is_published"]:
            update_dict["published_at"] = None

    update_dict["updated_at"] = now
    news.sqlmodel_update(update_dict)
    session.add(news)
    session.commit()
    session.refresh(news)
    
    # Load owner and images for response
    from app.models import User
    from app.schemas import NewsImagePublic
    
    owner_public = None
    if news.owner_id:
        owner = session.get(User, news.owner_id)
        if owner:
            owner_dict = owner.model_dump()
            owner_dict["is_first_superuser"] = owner.email == settings.FIRST_SUPERUSER
            owner_public = UserPublic.model_validate(owner_dict)
    
    images = []
    try:
        images_statement = (
            select(NewsImage)
            .where(NewsImage.news_id == news.id)
            .order_by(NewsImage.order)
        )
        images = session.exec(images_statement).all()
    except Exception:
        images = []
    
    return NewsPublic(
        id=news.id,
        title=news.title,
        content=news.content,
        is_published=news.is_published,
        owner_id=news.owner_id,
        owner=owner_public,
        published_at=news.published_at,
        created_at=news.created_at,
        updated_at=news.updated_at,
        images=[NewsImagePublic.model_validate(img.model_dump()) for img in images] if images else None,
    )


@router.delete("/{id}")
def delete_news(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete news. Regular users can only delete their own news, superusers can delete any.
    Also deletes all associated image files from the server.
    """
    news = session.get(News, id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    if not current_user.is_superuser and news.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get all images for this news item
    images_statement = select(NewsImage).where(NewsImage.news_id == id)
    images = session.exec(images_statement).all()
    
    # Delete image files from disk
    upload_dir = Path(settings.UPLOAD_DIR)
    if not upload_dir.is_absolute():
        base_dir = Path(__file__).parent.parent.parent.parent
        if base_dir.name == "app" and base_dir.parent.name == "app":
            base_dir = base_dir.parent
        upload_dir = base_dir / upload_dir
    
    for image in images:
        file_path = upload_dir / image.file_path
        if file_path.exists() and file_path.is_file():
            try:
                file_path.unlink()
            except Exception:
                # Log error but continue deletion
                pass
    
    # Delete news (images will be deleted from DB via CASCADE)
    session.delete(news)
    session.commit()
    
    return Message(message="News deleted successfully")

