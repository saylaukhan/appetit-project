from fastapi import APIRouter, Depends
from app.utils.auth_dependencies import get_current_admin
from app.models.user import User

router = APIRouter()

@router.get("/dashboard")
async def analytics_dashboard(current_user: User = Depends(get_current_admin)):
    """Аналитический дашборд."""
    return {"message": "Analytics dashboard - coming soon"}

@router.get("/orders")
async def order_analytics(current_user: User = Depends(get_current_admin)):
    """Аналитика по заказам."""
    return {"message": "Order analytics - coming soon"}

@router.get("/utm")
async def utm_analytics(current_user: User = Depends(get_current_admin)):
    """Аналитика по UTM меткам."""
    return {"message": "UTM analytics - coming soon"}
