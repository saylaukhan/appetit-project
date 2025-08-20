import requests
import json

def test_create_promo():
    url = 'http://localhost:8000/api/v1/promo-codes/'

    # Тестовые данные для создания промокода
    promo_data = {
        "code": "TEST25",
        "name": "Тестовая скидка 25%",
        "description": "Тестовый промокод для проверки API",
        "discount_type": "percentage",
        "discount_value": 25.0,
        "min_order_amount": 1000.0,
        "max_discount_amount": None,
        "usage_limit": None,
        "usage_limit_per_user": 1,
        "valid_from": None,
        "valid_until": None,
        "is_active": True
    }

    try:
        # Test POST request to create promo code
        print("Creating new promo code...")
        response = requests.post(url, json=promo_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            print("✅ Promo code created successfully!")

            # Verify it was saved by getting all promo codes
            print("\nVerifying promo code was saved...")
            get_response = requests.get(url)
            if get_response.status_code == 200:
                promos = get_response.json()
                test_promo = next((p for p in promos if p['code'] == 'TEST25'), None)
                if test_promo:
                    print(f"✅ Promo code found in database: {test_promo}")
                else:
                    print("❌ Promo code not found in database")
            else:
                print(f"❌ Failed to get promo codes: {get_response.status_code}")
        else:
            print(f"❌ Failed to create promo code: {response.status_code}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_create_promo()
