"""
Скрипт для заполнения базы данных тестовыми данными.
Создает админа, категории, блюда, модификаторы для демонстрации функциональности.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from decimal import Decimal
from datetime import datetime, timedelta

from app.models.user import User, UserRole
from app.models.menu import Category, Dish, Modifier
from app.models.promo_code import PromoCode, DiscountType
from app.models.banner import Banner

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class DatabaseSeeder:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def seed_all(self):
        """Запуск всех сидеров."""
        print("🌱 Начинаем заполнение базы данных...")
        
        await self.seed_users()
        await self.seed_categories()
        await self.seed_modifiers()
        await self.seed_dishes()
        await self.seed_promo_codes()
        await self.seed_banners()
        
        await self.db.commit()
        print("✅ База данных успешно заполнена тестовыми данными!")

    async def seed_users(self):
        """Создание тестовых пользователей."""
        print("👥 Создаем пользователей...")
        
        users_data = [
            {
                "phone": "+77771234567",
                "name": "Администратор",
                "role": UserRole.ADMIN,
                "password": "admin123"
            },
            {
                "phone": "+77772345678", 
                "name": "Повар Ахмет",
                "role": UserRole.KITCHEN,
                "password": "kitchen123"
            },
            {
                "phone": "+77773456789",
                "name": "Курьер Арман",
                "role": UserRole.COURIER,
                "password": "courier123"
            },
            {
                "phone": "+77774567890",
                "name": "Клиент Айгуль",
                "role": UserRole.CLIENT,
                "password": "client123"
            }
        ]

        for user_data in users_data:
            hashed_password = pwd_context.hash(user_data["password"])
            
            user = User(
                phone=user_data["phone"],
                name=user_data["name"],
                role=user_data["role"],
                hashed_password=hashed_password,
                is_active=True,
                is_verified=True
            )
            
            self.db.add(user)
            print(f"  ✓ {user_data['name']} ({user_data['role']})")

    async def seed_categories(self):
        """Создание категорий блюд."""
        print("📂 Создаем категории...")
        
        categories_data = [
            {
                "name": "Пицца",
                "description": "Ароматная пицца на тонком и пышном тесте",
                "sort_order": 1
            },
            {
                "name": "Бургеры", 
                "description": "Сочные бургеры с мясными котлетами",
                "sort_order": 2
            },
            {
                "name": "Роллы и суши",
                "description": "Свежие роллы и суши от шеф-повара",
                "sort_order": 3
            },
            {
                "name": "Салаты",
                "description": "Свежие салаты из сезонных овощей",
                "sort_order": 4
            },
            {
                "name": "Супы",
                "description": "Горячие супы на любой вкус",
                "sort_order": 5
            },
            {
                "name": "Напитки",
                "description": "Прохладительные и горячие напитки",
                "sort_order": 6
            },
            {
                "name": "Десерты",
                "description": "Сладкие десерты для завершения трапезы",
                "sort_order": 7
            }
        ]

        for cat_data in categories_data:
            category = Category(
                name=cat_data["name"],
                description=cat_data["description"],
                sort_order=cat_data["sort_order"],
                is_active=True
            )
            self.db.add(category)
            print(f"  ✓ {cat_data['name']}")

    async def seed_modifiers(self):
        """Создание модификаторов."""
        print("🔧 Создаем модификаторы...")
        
        modifiers_data = [
            # Размеры пиццы
            {"name": "Маленькая 25см", "price": Decimal("0")},
            {"name": "Средняя 30см", "price": Decimal("500")},
            {"name": "Большая 35см", "price": Decimal("1000")},
            
            # Добавки для бургеров
            {"name": "Дополнительная котлета", "price": Decimal("800")},
            {"name": "Бекон", "price": Decimal("400")},
            {"name": "Сыр Чеддер", "price": Decimal("200")},
            {"name": "Острый соус", "price": Decimal("0")},
            
            # Дополнения к роллам
            {"name": "Имбирь", "price": Decimal("0")},
            {"name": "Васаби", "price": Decimal("0")},
            {"name": "Соевый соус", "price": Decimal("0")},
            {"name": "Кунжут", "price": Decimal("100")},
            
            # Заправки для салатов
            {"name": "Оливковое масло", "price": Decimal("0")},
            {"name": "Цезарь соус", "price": Decimal("150")},
            {"name": "Бальзамик", "price": Decimal("100")},
            
            # Размеры напитков
            {"name": "0.3л", "price": Decimal("0")},
            {"name": "0.5л", "price": Decimal("200")},
            {"name": "1л", "price": Decimal("400")},
        ]

        for mod_data in modifiers_data:
            modifier = Modifier(
                name=mod_data["name"],
                price=mod_data["price"]
            )
            self.db.add(modifier)
            print(f"  ✓ {mod_data['name']}")

    async def seed_dishes(self):
        """Создание блюд."""
        print("🍕 Создаем блюда...")
        
        dishes_data = [
            # Пицца
            {
                "name": "Маргарита",
                "description": "Классическая пицца с томатным соусом, моцареллой и базиликом",
                "price": Decimal("2500"),
                "category_id": 1,
                "weight": "400г",
                "is_popular": True
            },
            {
                "name": "Пепперони",
                "description": "Острая пицца с салями пепперони и моцареллой",
                "price": Decimal("3200"),
                "category_id": 1,
                "weight": "450г",
                "is_popular": True
            },
            {
                "name": "Четыре сыра",
                "description": "Пицца с четырьмя видами сыра: моцарелла, пармезан, горгонзола, фета",
                "price": Decimal("3800"),
                "category_id": 1,
                "weight": "420г"
            },
            
            # Бургеры
            {
                "name": "Классик Бургер",
                "description": "Сочная говяжья котлета, салат, помидор, лук, соус",
                "price": Decimal("2200"),
                "category_id": 2,
                "weight": "350г",
                "is_popular": True
            },
            {
                "name": "Чизбургер",
                "description": "Бургер с двумя котлетами, сыром чеддер и фирменным соусом",
                "price": Decimal("2800"),
                "category_id": 2,
                "weight": "400г"
            },
            {
                "name": "Куриный Бургер",
                "description": "Хрустящая куриная котлета в панировке с салатом и майонезом",
                "price": Decimal("2000"),
                "category_id": 2,
                "weight": "320г"
            },
            
            # Роллы и суши
            {
                "name": "Филадельфия",
                "description": "Ролл с лососем, сливочным сыром и огурцом",
                "price": Decimal("1800"),
                "category_id": 3,
                "weight": "220г",
                "is_popular": True
            },
            {
                "name": "Калифорния",
                "description": "Ролл с креветкой, авокадо и огурцом в кунжуте",
                "price": Decimal("1600"),
                "category_id": 3,
                "weight": "200г"
            },
            {
                "name": "Дракон",
                "description": "Ролл с угрем, авокадо и унаги соусом",
                "price": Decimal("2200"),
                "category_id": 3,
                "weight": "240г"
            },
            
            # Салаты
            {
                "name": "Цезарь с курицей",
                "description": "Классический салат Цезарь с курицей гриль и пармезаном",
                "price": Decimal("1500"),
                "category_id": 4,
                "weight": "300г",
                "is_popular": True
            },
            {
                "name": "Греческий салат",
                "description": "Свежие овощи, фета, маслины, оливковое масло",
                "price": Decimal("1200"),
                "category_id": 4,
                "weight": "280г"
            },
            
            # Супы
            {
                "name": "Борщ украинский",
                "description": "Традиционный борщ с говядиной и сметаной",
                "price": Decimal("1000"),
                "category_id": 5,
                "weight": "400мл"
            },
            {
                "name": "Солянка мясная",
                "description": "Сытная солянка с копченостями и маслинами",
                "price": Decimal("1200"),
                "category_id": 5,
                "weight": "400мл"
            },
            
            # Напитки
            {
                "name": "Кока-Кола",
                "description": "Освежающая газированная вода",
                "price": Decimal("300"),
                "category_id": 6,
                "weight": "0.5л"
            },
            {
                "name": "Зеленый чай",
                "description": "Ароматный зеленый чай",
                "price": Decimal("200"),
                "category_id": 6,
                "weight": "400мл"
            },
            {
                "name": "Свежевыжатый сок",
                "description": "Апельсиновый сок собственного производства",
                "price": Decimal("600"),
                "category_id": 6,
                "weight": "300мл"
            },
            
            # Десерты
            {
                "name": "Тирамису",
                "description": "Классический итальянский десерт с маскарпоне",
                "price": Decimal("900"),
                "category_id": 7,
                "weight": "120г"
            },
            {
                "name": "Чизкейк Нью-Йорк",
                "description": "Нежный творожный торт с ягодным соусом",
                "price": Decimal("800"),
                "category_id": 7,
                "weight": "130г"
            }
        ]

        for dish_data in dishes_data:
            dish = Dish(
                name=dish_data["name"],
                description=dish_data["description"],
                price=dish_data["price"],
                category_id=dish_data["category_id"],
                weight=dish_data["weight"],
                is_available=True,
                is_popular=dish_data.get("is_popular", False)
            )
            self.db.add(dish)
            print(f"  ✓ {dish_data['name']} - {dish_data['price']} тг")

    async def seed_promo_codes(self):
        """Создание промокодов."""
        print("🎯 Создаем промокоды...")
        
        promo_codes_data = [
            {
                "code": "WELCOME10",
                "name": "Скидка для новых клиентов",
                "description": "10% скидка на первый заказ",
                "discount_type": DiscountType.PERCENTAGE,
                "discount_value": Decimal("10"),
                "min_order_amount": Decimal("2000"),
                "valid_until": datetime.now() + timedelta(days=30)
            },
            {
                "code": "PIZZA20",
                "name": "Скидка на пиццу",
                "description": "20% скидка на любую пиццу",
                "discount_type": DiscountType.PERCENTAGE,
                "discount_value": Decimal("20"),
                "min_order_amount": Decimal("2500"),
                "valid_until": datetime.now() + timedelta(days=7)
            },
            {
                "code": "DELIVERY500",
                "name": "Бесплатная доставка",
                "description": "500 тг скидка на доставку",
                "discount_type": DiscountType.FIXED,
                "discount_value": Decimal("500"),
                "min_order_amount": Decimal("1500"),
                "valid_until": datetime.now() + timedelta(days=14)
            }
        ]

        for promo_data in promo_codes_data:
            promo = PromoCode(
                code=promo_data["code"],
                name=promo_data["name"],
                description=promo_data["description"],
                discount_type=promo_data["discount_type"],
                discount_value=promo_data["discount_value"],
                min_order_amount=promo_data["min_order_amount"],
                valid_until=promo_data["valid_until"],
                is_active=True
            )
            self.db.add(promo)
            print(f"  ✓ {promo_data['code']} - {promo_data['discount_value']}{'%' if promo_data['discount_type'] == DiscountType.PERCENTAGE else 'тг'}")

    async def seed_banners(self):
        """Создание баннеров."""
        print("🎨 Создаем баннеры...")
        
        banners_data = [
            {
                "title": "Скидка 20% на всю пиццу",
                "description": "Только до конца месяца!",
                "image": "/static/banners/pizza-banner.jpg",
                "position": "main",
                "sort_order": 1,
                "show_until": datetime.now() + timedelta(days=30)
            },
            {
                "title": "Бесплатная доставка",
                "description": "При заказе от 3000 тенге",
                "image": "/static/banners/delivery-banner.jpg",
                "position": "main",
                "sort_order": 2
            },
            {
                "title": "Новое суши-меню",
                "description": "Попробуйте наши новые роллы",
                "image": "/static/banners/sushi-banner.jpg",
                "position": "category",
                "sort_order": 1
            }
        ]

        for banner_data in banners_data:
            banner = Banner(
                title=banner_data["title"],
                description=banner_data["description"],
                image=banner_data["image"],
                position=banner_data["position"],
                sort_order=banner_data["sort_order"],
                show_until=banner_data.get("show_until"),
                is_active=True
            )
            self.db.add(banner)
            print(f"  ✓ {banner_data['title']}")


# Функция для запуска сидера
async def run_seeder(db: AsyncSession):
    """Запуск заполнения базы данных."""
    seeder = DatabaseSeeder(db)
    await seeder.seed_all()
