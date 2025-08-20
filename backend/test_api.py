import requests

def test_api():
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get('http://localhost:8000/health')
        print(f"Health Status: {response.status_code}")
        print(f"Health Response: {response.text}")

        # Test promo codes endpoint
        print("\nTesting promo codes endpoint...")
        response = requests.get('http://localhost:8000/api/v1/promo-codes/')
        print(f"Promo codes Status: {response.status_code}")
        print(f"Promo codes Response: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
