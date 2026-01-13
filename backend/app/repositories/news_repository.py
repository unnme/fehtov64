"""News repository for database operations."""
import uuid
from datetime import datetime, timezone

from sqlmodel import Session

from app.models import News
from app.schemas import NewsCreate


def create_news(*, session: Session, news_in: NewsCreate, owner_id: uuid.UUID) -> News:
    """Create a new news item."""
    now = datetime.now(timezone.utc)
    news_data = news_in.model_dump()
    if news_data.get("is_published"):
        news_data["published_at"] = now
    else:
        news_data["published_at"] = None

    db_news = News.model_validate(
        news_data,
        update={
            "owner_id": owner_id,
            "created_at": now,
            "updated_at": now,
        },
    )
    session.add(db_news)
    session.commit()
    session.refresh(db_news)
    return db_news
