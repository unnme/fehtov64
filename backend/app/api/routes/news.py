import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import News, NewsImage
from app.schemas import (
    Message,
    NewsCreate,
    NewsPublic,
    NewsPublicList,
    NewsUpdate,
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
        
        for news_item in news_list:
            try:
                images_statement = (
                    select(NewsImage)
                    .where(NewsImage.news_id == news_item.id)
                    .order_by(NewsImage.order)
                )
                news_item.images = session.exec(images_statement).all()
            except Exception:
                news_item.images = []
            
        return NewsPublicList(data=news_list, count=count)


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
    
    for news_item in news_list:
        try:
            images_statement = (
                select(NewsImage)
                .where(NewsImage.news_id == news_item.id)
                .order_by(NewsImage.order)
            )
            news_item.images = session.exec(images_statement).all()
        except Exception:
            news_item.images = []
        
        return NewsPublicList(data=news_list, count=count)


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
    
    try:
        images_statement = (
            select(NewsImage)
            .where(NewsImage.news_id == news_item.id)
            .order_by(NewsImage.order)
        )
        news_item.images = session.exec(images_statement).all()
    except Exception:
        news_item.images = []
    
    return news_item


@router.post("/", response_model=NewsPublic)
def create_news(
    *, session: SessionDep, current_user: CurrentUser, news_in: NewsCreate
) -> Any:
    """
    Create new news.
    """
    now = datetime.now(timezone.utc)
    news_data = news_in.model_dump()
    
    if news_data.get("is_published"):
        news_data["published_at"] = now
    else:
        news_data["published_at"] = None

    news = News.model_validate(
        news_data,
        update={
            "owner_id": current_user.id,
            "created_at": now,
            "updated_at": now,
        },
    )
    session.add(news)
    session.commit()
    session.refresh(news)
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
    return news


@router.delete("/{id}")
def delete_news(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete news. Regular users can only delete their own news, superusers can delete any.
    """
    news = session.get(News, id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    if not current_user.is_superuser and news.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(news)
    session.commit()
    return Message(message="News deleted successfully")

