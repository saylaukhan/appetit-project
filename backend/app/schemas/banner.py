from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BannerBase(BaseModel):
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    position: str = "main"
    sort_order: int = 0
    is_active: bool = True
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    position: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None

class BannerResponse(BannerBase):
    id: int
    view_count: int
    click_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BannerListResponse(BaseModel):
    banners: list[BannerResponse]
    total_count: int

class BannerStatsResponse(BaseModel):
    id: int
    title: str
    position: str
    is_active: bool
    view_count: int
    click_count: int
    ctr: float  # Click Through Rate
    created_at: datetime
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None