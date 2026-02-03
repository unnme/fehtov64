"""Application exceptions with structured error responses."""

from fastapi import HTTPException


class AppError(HTTPException):
    """Base application error with code and message."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message},
        )


class BadRequestError(AppError):
    """400 Bad Request."""

    def __init__(self, code: str, message: str):
        super().__init__(400, code, message)


class NotFoundError(AppError):
    """404 Not Found."""

    def __init__(self, code: str, message: str):
        super().__init__(404, code, message)


class ConflictError(AppError):
    """409 Conflict."""

    def __init__(self, code: str, message: str):
        super().__init__(409, code, message)


class ForbiddenError(AppError):
    """403 Forbidden."""

    def __init__(self, code: str, message: str):
        super().__init__(403, code, message)
