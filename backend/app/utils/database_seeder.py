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
                "name": "Комбо",
                "description": "Готовые наборы блюд по выгодным ценам",
                "sort_order": 1
            },
            {
                "name": "Блюда", 
                "description": "Основные блюда: шаурма, донер, хот-дог",
                "sort_order": 2
            },
            {
                "name": "Закуски",
                "description": "Дополнительные закуски и гарниры",
                "sort_order": 3
            },
            {
                "name": "Соусы",
                "description": "Различные соусы для дополнения блюд",
                "sort_order": 4
            },
            {
                "name": "Напитки",
                "description": "Прохладительные и горячие напитки",
                "sort_order": 5
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
            # Комбо
            {
                "name": "Комбо для ОДНОГО",
                "description": "Фирменная шаурма, картошка фри и айран.",
                "price": Decimal("2490"),
                "category_id": 1,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/05/21/fe556df31b0086a084ab61a2c8ac99ce---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Комбо для ДВОИХ",
                "description": "2 фирменные средние шаурмы, порция фри и Пепси 0.5л.",
                "price": Decimal("4490"),
                "category_id": 1,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/05/21/3b38e62614d5f7b68f32e2a86835fcbc---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Комбо для КОМПАНИИ",
                "description": "4 средние шаурмы на выбор, 2 порции фри и 2 сока 0.3л на выбор.",
                "price": Decimal("8900"),
                "category_id": 1,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/05/21/0aabb5c9e9e49e3d1fd81e938ee26dc2---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },

            # Блюда
            {
                "name": "Фирменная Средняя шаурма (Новинка)",
                "description": "Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, белый соус.",
                "price": Decimal("1990"),
                "category_id": 2,
                "weight": "350г",
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/04/04/b9ef70d2195ea30d7a1a5a1b22450db8---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Фирменная Большая шаурма (Новинка)",
                "description": "Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, белый соус.",
                "price": Decimal("2990"),
                "category_id": 2,
                "weight": "500г",
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/04/17/db9bdbdea43c0f2d5c625dc1ddac74e5---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Классическая Средняя шаурма (Хит)",
                "description": "Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, красный соус, белый соус.",
                "price": Decimal("1690"),
                "category_id": 2,
                "weight": "350г",
                "is_popular": True,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/03/19/cb4e1a15ed8eb66b4cb3f04266b87a8f---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Классическая Большая шаурма",
                "description": "Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, красный соус, белый соус.",
                "price": Decimal("2490"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/23b1fdb4fa17aaba0faa168238ce3d05---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Куриная Большая шаурма",
                "description": "Тонкий лаваш, сочные кусочки курицы, картофель фри, лук, помидор, красный соус, белый соус.",
                "price": Decimal("2390"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/978f0e0a396b13d5f8bcad7d7b5c79c9---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Куриная Средняя шаурма",
                "description": "Тонкий лаваш, сочные кусочки курицы, картофель фри, лук, помидор, красный соус, белый соус.",
                "price": Decimal("1590"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/de192faaddc80e9da0439c267659cf0b---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Мраморная Большая шаурма (Новинка)",
                "description": "Тонкий лаваш, сочные кусочки мраморной говядины, картофель фри, лук, помидор, красный соус, белый соус.",
                "price": Decimal("3390"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/05/21/f84b8267d07585cfecf2493841029507---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Мраморная Средняя шаурма (Новинка)",
                "description": "Тонкий лаваш, сочные кусочки мраморной говядины, картофель фри, лук, помидор, красный соус, белый соус.",
                "price": Decimal("2390"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/03/19/cb4e1a15ed8eb66b4cb3f04266b87a8f---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Донер с говядиной",
                "description": "Булочка, сочные кусочки говядины, картофель фри, лук, красный соус, белый соус.",
                "price": Decimal("1490"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/40c729cbc8fddf4dc03a48aa50517ab6---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Донер с курицей",
                "description": "Булочка, сочные кусочки курицы, картофель фри, лук, красный соус, белый соус.",
                "price": Decimal("1490"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/e09cfde451e5dde3c8ffa0f2f53b56bb---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Хот-дог",
                "description": "Булочка, сосиски обжаренные на гриле, картофель фри, красный соус, белый соус.",
                "price": Decimal("990"),
                "category_id": 2,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/5df94c16b16bc7906f55d652a46d0f2f---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },

            # Закуски
            {
                "name": "Шекер",
                "description": "Сладкие палочки из теста, обжаренные во фритюре: хрустящие снаружи и нежные внутри",
                "price": Decimal("400"),
                "category_id": 3,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/06/27/bc977c217d9ceed2395733bcd3e5127e---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Чебуречки",
                "description": "Сочные и вкусные чебуречки, обжаренные во фритюре.",
                "price": Decimal("990"),
                "category_id": 3,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/5d00d455fdad4c1ffba2f003262fa348---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Наггетсы",
                "description": "Нежнейшие кусочки куриного мяса в золотистой панировке!",
                "price": Decimal("1490"),
                "category_id": 3,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/b059d0e8a3ad4129618668e05fb3725b---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Картофель Фри",
                "description": "Ароматный и хрустящий картофель фри.",
                "price": Decimal("890"),
                "category_id": 3,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/005a8258c1c7ffaa6b32b5c76ec54b40---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Дольки",
                "description": "Воздушная картофельная мякоть с деликатным пряным вкусом!",
                "price": Decimal("1190"),
                "category_id": 3,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/99f031c4db6f80e433b1a4c1c5acf6e7---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },

            # Соусы
            {
                "name": "Перчики острые 15г",
                "description": "",
                "price": Decimal("240"),
                "category_id": 4,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/8032248095ad95685129187c86a69fd3---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Соус Сырный 30г",
                "description": "",
                "price": Decimal("240"),
                "category_id": 4,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/ef651ed87b4c3ab6e22e539c6081462c---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Соус Томатный 30г",
                "description": "",
                "price": Decimal("240"),
                "category_id": 4,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/c282f9bf851d7be2402b14a824e3b859---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Соус Горчичный 30г",
                "description": "",
                "price": Decimal("240"),
                "category_id": 4,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/628b8291327c6b3a506c71c9f3597351---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Соус Барбекю 30г",
                "description": "",
                "price": Decimal("240"),
                "category_id": 4,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/efa6d1480bb4a3947d56250494bdc83a---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Соус Чесночный 30г",
                "description": "",
                "price": Decimal("240"),
                "category_id": 4,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/0448f3c2b674898877d8a7c860eae049---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "соус Острый 30г",
                "description": "",
                "price": Decimal("240"),
                "category_id": 4,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/04/17/9a29b3909ca001074b9d29b36b5b5384---jpeg_1100_1e6e0_convert.webp"
            },

            # Напитки
            {
                "name": "Сок Лимонный 1,0л",
                "description": "",
                "price": Decimal("990"),
                "category_id": 5,
                "weight": "1.0л",
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/04/04/a20ed5cf74b611706a9079cac239e12d---png_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Сок Лимонный 0,3л",
                "description": "",
                "price": Decimal("390"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/e3445e38097d7fb9ef8e58c64d1b0534---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Морс Смородина 1,0л",
                "description": "",
                "price": Decimal("1390"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/fe29ee0ab3100a6b940d873ea691e9ac---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Морс Смородина 0,3л",
                "description": "",
                "price": Decimal("490"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/8efdca35c475f581483df64ff8337bbb---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Айран 1ст",
                "description": "",
                "price": Decimal("390"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/8c5dd0e3612f293fe87d01a7a817669d---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Пепси 1л",
                "description": "",
                "price": Decimal("740"),
                "category_id": 5,
                "weight": "1л",
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/b8e35534332c0d9853bb8ee9fe29646f---jpeg_1100_1e6e0_convert.webp "
            },
            {
                "name": "Пепси 0,5л",
                "description": "",
                "price": Decimal("640"),
                "category_id": 5,
                "weight": "0.5л",
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/3a79628d7f921f91eafd5c3a1bd30012---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Пиала чай 1л",
                "description": "",
                "price": Decimal("740"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/04/04/6c5f30cf228ba984715d633e13d350f6---png_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Пиала чай 0,5л",
                "description": "",
                "price": Decimal("640"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/04/04/686ea4bea44c0cbf418254f5cca9e815---png_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "ДаДа 1л",
                "description": "",
                "price": Decimal("990"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/13c5ec64ce21c39139e0f414584f49f0---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Сок ДаДа 0,2л",
                "description": "",
                "price": Decimal("390"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/5dc2c7ea9c106dd4e56c797384ca4d98---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Асу 0,5л",
                "description": "",
                "price": Decimal("390"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/da4736943db10bcb6288e2877bde7435---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Асу 1л",
                "description": "",
                "price": Decimal("490"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/41ca19a6fbf1fc0611f3895f8907f92c---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Лавина 0,5л",
                "description": "",
                "price": Decimal("690"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/5410f4fa01ed227663bc945e2c7fe4ba---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            },
            {
                "name": "Горила 0,5л",
                "description": "",
                "price": Decimal("690"),
                "category_id": 5,
                "is_popular": False,
                "image": "https://cdn-kz11.foodpicasso.com/assets/2025/02/10/17109ed26f93ceebcfca01d1120d8fb4---jpeg_420x420:whitepadding15_94310_convert.webp?v2"
            }
        ]

        for dish_data in dishes_data:
            dish = Dish(
                name=dish_data["name"],
                description=dish_data["description"],
                price=dish_data["price"],
                category_id=dish_data["category_id"],
                image=dish_data.get("image"),
                weight=dish_data.get("weight"),
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
