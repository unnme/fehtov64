import uuid
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlmodel import select

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.errors import ErrorCode, NotFoundError
from app.models import Person, PersonImage
from app.schemas import Message, PersonImagePublic
from app.services.image_service import image_service

router = APIRouter(prefix="/persons/{person_id}/image", tags=["person-images"])
public_router = APIRouter(prefix="/persons/{person_id}/image", tags=["person-images"])


@router.post("/", dependencies=[Depends(get_current_active_superuser)], response_model=PersonImagePublic)
async def upload_person_image(
    person_id: uuid.UUID,
    file: Annotated[UploadFile, File()],
    session: SessionDep,
) -> Any:
    person = session.get(Person, person_id)
    if not person:
        raise NotFoundError(ErrorCode.PERSON_NOT_FOUND, "Person not found")

    existing = session.exec(
        select(PersonImage).where(PersonImage.person_id == person_id)
    ).first()

    file_path, file_size = image_service.save_person_image(file, person_id)
    file_ext = Path(file_path).suffix.lower()
    mime_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    mime_type = mime_type_map.get(file_ext, file.content_type or "image/jpeg")

    if existing:
        old_path = image_service.UPLOAD_DIR / existing.file_path
        if old_path.exists():
            old_path.unlink()
        existing.file_name = file.filename or "image"
        existing.file_path = file_path
        existing.file_size = file_size
        existing.mime_type = mime_type
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    image = PersonImage(
        person_id=person_id,
        file_name=file.filename or "image",
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
    )
    session.add(image)
    session.commit()
    session.refresh(image)
    return image


@router.get("/", dependencies=[Depends(get_current_active_superuser)], response_model=PersonImagePublic)
def get_person_image(person_id: uuid.UUID, session: SessionDep) -> Any:
    person = session.get(Person, person_id)
    if not person:
        raise NotFoundError(ErrorCode.PERSON_NOT_FOUND, "Person not found")

    image = session.exec(
        select(PersonImage).where(PersonImage.person_id == person_id)
    ).first()
    if not image:
        raise NotFoundError(ErrorCode.PERSON_IMAGE_NOT_FOUND, "Person image not found")
    return image


@public_router.get("/file")
def get_person_image_file(person_id: uuid.UUID, session: SessionDep) -> FileResponse:
    person = session.get(Person, person_id)
    if not person:
        raise NotFoundError(ErrorCode.PERSON_NOT_FOUND, "Person not found")

    image = session.exec(
        select(PersonImage).where(PersonImage.person_id == person_id)
    ).first()
    if not image:
        raise NotFoundError(ErrorCode.PERSON_IMAGE_NOT_FOUND, "Person image not found")

    upload_dir = image_service.UPLOAD_DIR
    file_path = upload_dir / image.file_path

    possible_paths = [
        file_path,
        file_path.with_suffix(".jpg"),
    ]

    person_dir = image_service.get_person_upload_path(person_id)
    file_name = Path(image.file_path).name
    possible_paths.append(person_dir / file_name)

    jpg_name = Path(file_name).stem + ".jpg"
    possible_paths.append(person_dir / jpg_name)

    png_name = Path(file_name).stem + ".png"
    possible_paths.append(person_dir / png_name)

    found_path = None
    for path in possible_paths:
        if path.exists() and path.is_file():
            found_path = path
            break

    if not found_path:
        # 404 with technical details for debugging
        raise HTTPException(
            status_code=404,
            detail=f"Image file not found. Checked paths: {[str(p) for p in possible_paths[:3]]}",
        )

    return FileResponse(
        path=str(found_path),
        media_type=image.mime_type,
        filename=image.file_name,
    )


@router.delete("/", dependencies=[Depends(get_current_active_superuser)], response_model=Message)
def delete_person_image(person_id: uuid.UUID, session: SessionDep) -> Message:
    person = session.get(Person, person_id)
    if not person:
        raise NotFoundError(ErrorCode.PERSON_NOT_FOUND, "Person not found")

    image = session.exec(
        select(PersonImage).where(PersonImage.person_id == person_id)
    ).first()
    if not image:
        raise NotFoundError(ErrorCode.PERSON_IMAGE_NOT_FOUND, "Person image not found")

    file_path = image_service.UPLOAD_DIR / image.file_path
    if file_path.exists():
        file_path.unlink()

    session.delete(image)
    session.commit()
    return Message(message="Image deleted successfully")
