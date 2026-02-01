"""
Pydantic schemas for API requests and responses.
All schemas are organized in separate modules for better maintainability.
"""

# Import all schemas for backward compatibility
from app.schemas.auth import (
    Message,
    NewPassword,
    Token,
    TokenPayload,
    UpdatePassword,
)
from app.schemas.common import (
    capitalize_name_part,
    normalize_optional_str,
    normalize_person_name,
    normalize_phone_list,
    normalize_position_name,
)
from app.schemas.documents import (
    DocumentCategoriesPublic,
    DocumentCategoryCreate,
    DocumentCategoryPublic,
    DocumentCategoryUpdate,
    DocumentCreate,
    DocumentPublic,
    DocumentsPublic,
    DocumentUpdate,
)
from app.schemas.news import (
    NewsCreate,
    NewsImageList,
    NewsImagePublic,
    NewsPublic,
    NewsPublicList,
    NewsUpdate,
    TagPublic,
    TagsPublic,
)
from app.schemas.organization_card import (
    OrganizationCardCreate,
    OrganizationCardPublic,
    OrganizationCardUpdate,
)
from app.schemas.persons import (
    PersonCreate,
    PersonImagePublic,
    PersonPublic,
    PersonsPublic,
    PersonUpdate,
)
from app.schemas.positions import (
    PositionCreate,
    PositionPublic,
    PositionsPublic,
    PositionUpdate,
)
from app.schemas.users import (
    EmailVerificationCode,
    EmailVerificationRequest,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.schemas.utils import (
    BlockedIPInfo,
    BlockedIPsList,
    PrivateUserCreate,
)

__all__ = [
    # Auth
    "Message",
    "Token",
    "TokenPayload",
    "NewPassword",
    "UpdatePassword",
    # Common utilities
    "normalize_optional_str",
    "normalize_phone_list",
    "normalize_person_name",
    "normalize_position_name",
    "capitalize_name_part",
    # Documents
    "DocumentCategoryCreate",
    "DocumentCategoryUpdate",
    "DocumentCategoryPublic",
    "DocumentCategoriesPublic",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentPublic",
    "DocumentsPublic",
    # News
    "NewsCreate",
    "NewsUpdate",
    "NewsPublic",
    "NewsPublicList",
    "NewsImagePublic",
    "NewsImageList",
    "TagPublic",
    "TagsPublic",
    # Organization Card
    "OrganizationCardCreate",
    "OrganizationCardUpdate",
    "OrganizationCardPublic",
    # Persons
    "PersonCreate",
    "PersonUpdate",
    "PersonImagePublic",
    "PersonPublic",
    "PersonsPublic",
    # Positions
    "PositionCreate",
    "PositionUpdate",
    "PositionPublic",
    "PositionsPublic",
    # Users
    "UserCreate",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "EmailVerificationRequest",
    "EmailVerificationCode",
    "UserPublic",
    "UsersPublic",
    # Utils
    "BlockedIPInfo",
    "BlockedIPsList",
    "PrivateUserCreate",
]
