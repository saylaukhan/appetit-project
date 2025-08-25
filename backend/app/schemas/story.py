from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoryBase(BaseModel):
    title: str
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None

class StoryCreate(StoryBase):
    cover_image: str
    content_image: str

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    content_image: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None

class StoryResponse(StoryBase):
    id: int
    cover_image: str
    content_image: str
    view_count: int
    click_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StoryListResponse(BaseModel):
    stories: list[StoryResponse]
    total_count: int

class StoryStatsResponse(BaseModel):
    id: int
    title: str
    is_active: bool
    view_count: int
    click_count: int
    ctr: float  # Click Through Rate
    created_at: datetime
    show_from: Optional[datetime] = None
    show_until: Optional[datetime] = None