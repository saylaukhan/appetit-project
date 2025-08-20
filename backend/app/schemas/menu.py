from pydantic import BaseModel, Field, validator
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

class VariantResponse(BaseModel):
    id: int
    name: str
    price: Decimal = Field(description="Цена варианта (может быть 0)")
    is_default: bool = False
    sort_order: int = 0

    class Config:
        from_attributes = True

class VariantGroupResponse(BaseModel):
    id: int
    name: str
    is_required: bool = True
    is_multiple: bool = False
    sort_order: int = 0
    variants: List[VariantResponse] = []

    class Config:
        from_attributes = True

class AddonResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    category: Optional[str] = None

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
    is_popular: bool = False
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
    variant_groups: List[VariantGroupResponse] = []
    addons: List[AddonResponse] = []

    class Config:
        from_attributes = True

class DishCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    price: Decimal = Field(..., gt=0)
    image: Optional[str] = Field(None, max_length=255)
    weight: Optional[str] = Field(None, max_length=50)
    category_id: int = Field(..., gt=0)
    is_available: bool = Field(True)
    is_popular: bool = Field(False)
    sort_order: int = Field(0)
    addon_ids: Optional[List[int]] = Field(None, description="Список ID добавок для блюда")
    variant_ids: Optional[List[int]] = Field(None, description="Список ID вариантов для блюда")

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Название блюда не может быть пустым')
        return v.strip()

class DishUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, gt=0)
    image: Optional[str] = Field(None, max_length=255)
    weight: Optional[str] = Field(None, max_length=50)
    category_id: Optional[int] = Field(None, gt=0)
    is_available: Optional[bool] = None
    is_popular: Optional[bool] = None
    sort_order: Optional[int] = None
    addon_ids: Optional[List[int]] = Field(None, description="Список ID добавок для блюда")
    variant_ids: Optional[List[int]] = Field(None, description="Список ID вариантов для блюда")

# Схемы для добавок (Addons)

class AddonCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., ge=0)
    category: Optional[str] = Field(None, max_length=50)

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Название добавки не может быть пустым')
        return v.strip()

class AddonUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=50)

# Схемы для вариантов
class VariantCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(0, ge=0)
    group_id: int = Field(..., gt=0)
    is_default: bool = False
    sort_order: int = 0

class VariantGroupCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    is_required: bool = True
    is_multiple: bool = False
    sort_order: int = 0
