"""Utility routes for health checks and IP blocking management."""
from time import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_active_superuser
from app.core.ip_blocking import get_ip_blocking_middleware
from app.schemas import BlockedIPInfo, BlockedIPsList, Message

router = APIRouter(prefix="/utils", tags=["utils"])


@router.get("/health-check/")
async def health_check() -> bool:
    """
    Health check endpoint.
    
    Returns:
        True if service is healthy
    """
    return True


@router.get(
    "/blocked-ips/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=BlockedIPsList,
)
def get_blocked_ips() -> Any:
    """
    Get list of blocked IP addresses.
    
    Only accessible by superusers.
    
    Returns:
        List of blocked IPs with their information
    """
    middleware = get_ip_blocking_middleware()
    if not middleware:
        return BlockedIPsList(blocked_ips=[], count=0)
    
    blocked_ips_dict = middleware.get_blocked_ips()
    now = time()
    
    blocked_ips_list = [
        BlockedIPInfo(
            ip=block_info.ip,
            blocked_until=block_info.blocked_until,
            remaining_seconds=int(block_info.blocked_until - now),
            failed_attempts_count=block_info.failed_attempts_count,
            first_attempt_time=block_info.first_attempt_time,
            last_attempt_time=block_info.last_attempt_time,
            block_reason=block_info.block_reason,
            user_agent=block_info.user_agent,
            attempted_emails=block_info.attempted_emails,
        )
        for ip, block_info in blocked_ips_dict.items()
    ]
    
    return BlockedIPsList(blocked_ips=blocked_ips_list, count=len(blocked_ips_list))


@router.post(
    "/unblock-ip/{ip_address}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def unblock_ip(ip_address: str) -> Any:
    """
    Unblock IP address.
    
    Only accessible by superusers.
    
    Args:
        ip_address: IP address to unblock
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If middleware is not available or IP is not blocked
    """
    middleware = get_ip_blocking_middleware()
    if not middleware:
        raise HTTPException(status_code=500, detail="IP blocking middleware not available")
    
    if middleware.unblock_ip(ip_address):
        return Message(message=f"IP address {ip_address} has been unblocked")
    else:
        raise HTTPException(status_code=404, detail=f"IP address {ip_address} is not blocked")
