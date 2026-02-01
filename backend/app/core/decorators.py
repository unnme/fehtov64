"""Decorators for common functionality."""
import asyncio
import time
from collections.abc import Callable
from functools import wraps
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")


def prevent_timing_attacks(min_time: float = 0.2):
    """
    Decorator to prevent timing attacks by ensuring minimum processing time.

    Args:
        min_time: Minimum processing time in seconds (default: 0.2s)
    """

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                elapsed = time.time() - start
                if elapsed < min_time:
                    await asyncio.sleep(min_time - elapsed)
                return result
            except Exception:
                elapsed = time.time() - start
                if elapsed < min_time:
                    await asyncio.sleep(min_time - elapsed)
                raise

        @wraps(func)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            start = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed = time.time() - start
                if elapsed < min_time:
                    time.sleep(min_time - elapsed)
                return result
            except Exception:
                elapsed = time.time() - start
                if elapsed < min_time:
                    time.sleep(min_time - elapsed)
                raise

        # Return appropriate wrapper based on whether function is async
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
