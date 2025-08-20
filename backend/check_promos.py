import asyncio
from app.core.database import get_db_session
from sqlalchemy import select
from app.models.promo_code import PromoCode

async def check_db():
    try:
        async for db in get_db_session():
            result = await db.execute(select(PromoCode))
            promos = result.scalars().all()
            print(f'Found {len(promos)} promo codes:')
            for p in promos:
                print(f'  - {p.code}: {p.name} (active: {p.is_active})')
            if not promos:
                print('No promo codes found in database!')
            break  # Выходим после первого использования
    except Exception as e:
        print(f'Error checking database: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_db())
