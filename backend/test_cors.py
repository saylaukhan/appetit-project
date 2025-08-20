import requests

def test_cors():
    # Test with Origin header
    headers = {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
    }

    try:
        print("Testing CORS with Origin header...")
        response = requests.get('http://localhost:8000/api/v1/promo-codes/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"CORS headers:")
        for header, value in response.headers.items():
            if 'cors' in header.lower() or 'access' in header.lower() or 'allow' in header.lower():
                print(f"  {header}: {value}")

        if response.status_code == 200:
            print("✅ CORS working correctly!")
        else:
            print(f"❌ CORS issue: {response.status_code}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_cors()
