import requests
import json

# Базовый URL API
BASE_URL = "http://localhost:8000/api/admin"

# Токен администратора (нужно получить из локального хранилища браузера или создать)
TOKEN = "your-admin-token-here"  # Замените на реальный токен

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_get_stories():
    """Тестируем получение списка историй"""
    print("Тестируем GET /api/admin/stories...")
    try:
        response = requests.get(f"{BASE_URL}/stories", headers=headers)
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Ошибка: {e}")

def test_create_story():
    """Тестируем создание новой истории"""
    print("\nТестируем POST /api/admin/stories...")
    story_data = {
        "title": "Тестовая история",
        "description": "Описание тестовой истории",
        "cover_image": "/static/uploads/test-cover.jpg",
        "content_image": "/static/uploads/test-content.jpg",
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/stories", 
                               headers=headers, 
                               json=story_data)
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.json().get('story', {}).get('id')
    except Exception as e:
        print(f"Ошибка: {e}")
        return None

def test_update_story(story_id):
    """Тестируем обновление истории"""
    if not story_id:
        print("Нет ID истории для обновления")
        return
    
    print(f"\nТестируем PUT /api/admin/stories/{story_id}...")
    update_data = {
        "title": "Обновленная тестовая история",
        "description": "Обновленное описание",
        "is_active": False
    }
    
    try:
        response = requests.put(f"{BASE_URL}/stories/{story_id}", 
                              headers=headers, 
                              json=update_data)
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Ошибка: {e}")

def test_delete_story(story_id):
    """Тестируем удаление истории"""
    if not story_id:
        print("Нет ID истории для удаления")
        return
    
    print(f"\nТестируем DELETE /api/admin/stories/{story_id}...")
    try:
        response = requests.delete(f"{BASE_URL}/stories/{story_id}", headers=headers)
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    print("=== Тестирование API для управления историями ===")
    print("ВНИМАНИЕ: Замените TOKEN на реальный токен администратора!")
    print()
    
    # Тестируем получение списка историй
    test_get_stories()
    
    # Тестируем создание истории
    story_id = test_create_story()
    
    # Тестируем обновление
    test_update_story(story_id)
    
    # Тестируем получение обновленного списка
    test_get_stories()
    
    # Тестируем удаление
    test_delete_story(story_id)
    
    # Проверяем что история удалена
    test_get_stories()