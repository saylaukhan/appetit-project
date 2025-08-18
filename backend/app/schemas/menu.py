from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True

    class Config:
        from_attributes = True

class ModifierResponse(BaseModel):
    id: int
    name: str
    price: Decimal = Field(description="Цена модификатора (может быть 0)")
    is_required: bool = False

    class Config:
        from_attributes = True

class DishResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    image: Optional[str] = None
    category_id: int
    is_available: bool = True
    weight: Optional[str] = None

    class Config:
        from_attributes = True

class DishDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    image: Optional[str] = None
    category_id: int
    category_name: str
    is_available: bool = True
    weight: Optional[str] = None
    modifiers: List[ModifierResponse] = []

    class Config:
        from_attributes = True
