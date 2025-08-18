from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
async def analytics_dashboard():
    """Аналитический дашборд."""
    return {"message": "Analytics dashboard - coming soon"}

@router.get("/orders")
async def order_analytics():
    """Аналитика по заказам."""
    return {"message": "Order analytics - coming soon"}

@router.get("/utm")
async def utm_analytics():
    """Аналитика по UTM меткам."""
    return {"message": "UTM analytics - coming soon"}
