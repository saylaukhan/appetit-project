import asyncio
import logging
from typing import Optional, Dict, Any
from telethon import TelegramClient
from telethon.errors import PhoneNumberInvalidError, FloodWaitError, SessionPasswordNeededError
from telethon.tl.functions.auth import SendCodeRequest, SignInRequest
from app.core.config import settings
import secrets
import string
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TelegramAuthService:
    """
    Сервис для авторизации через Telegram API.
    
    ВАЖНО: Использует временные in-memory сессии вместо файловых сессий.
    Это означает, что:
    - При перезапуске приложения сессии теряются
    - Файлы типа session_*.session не создаются на диске  
    - Каждая авторизация - одноразовая
    - Меньше засорения файловой системы
    """
    
    def __init__(self):
        self.api_id = settings.TELEGRAM_API_ID
        self.api_hash = settings.TELEGRAM_API_HASH
        self.enabled = settings.TELEGRAM_ENABLED
        self._clients: Dict[str, TelegramClient] = {}
        self._verification_codes: Dict[str, Dict[str, Any]] = {}
    
    def _get_client(self, phone: str) -> TelegramClient:
        """Получить или создать Telegram клиент для номера телефона."""
        if phone not in self._clients:
            # Используем временные in-memory сессии вместо файловых
            # Это означает что при перезапуске приложения нужно заново авторизоваться
            # но файлы сессий не засоряют файловую систему
            from telethon.sessions import MemorySession
            self._clients[phone] = TelegramClient(
                MemorySession(), 
                self.api_id, 
                self.api_hash
            )
        return self._clients[phone]
    
    def _generate_verification_code(self) -> str:
        """Генерация 6-значного кода подтверждения."""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    async def request_telegram_code(self, phone: str) -> Dict[str, Any]:
        """
        Запрос кода подтверждения через Telegram API.
        
        Args:
            phone: Номер телефона в формате +7XXXXXXXXXX
            
        Returns:
            Dict с информацией о результате запроса
        """
        if not self.enabled:
            # Если Telegram отключен, генерируем фиктивный код для разработки
            verification_code = self._generate_verification_code()
            self._verification_codes[phone] = {
                'code': verification_code,
                'expires_at': datetime.utcnow() + timedelta(minutes=10),
                'phone_code_hash': 'dev_hash_' + verification_code
            }
            
            logger.info(f"Telegram отключен. Код для {phone}: {verification_code}")
            
            return {
                'success': True,
                'message': 'Код подтверждения отправлен через Telegram',
                'phone_code_hash': self._verification_codes[phone]['phone_code_hash'],
                'dev_mode': True,
                'dev_code': verification_code  # Только для разработки
            }
        
        try:
            client = self._get_client(phone)
            
            if not client.is_connected():
                await client.connect()
            
            # Отправка запроса на получение кода
            result = await client(SendCodeRequest(
                phone_number=phone,
                api_id=self.api_id,
                api_hash=self.api_hash,
                settings=None
            ))
            
            # Сохранение информации о запросе
            self._verification_codes[phone] = {
                'phone_code_hash': result.phone_code_hash,
                'expires_at': datetime.utcnow() + timedelta(minutes=10),
                'type': result.type.__class__.__name__
            }
            
            logger.info(f"Код отправлен через Telegram для {phone}")
            
            return {
                'success': True,
                'message': 'Код подтверждения отправлен через Telegram',
                'phone_code_hash': result.phone_code_hash,
                'type': result.type.__class__.__name__
            }
            
        except PhoneNumberInvalidError:
            logger.error(f"Неверный номер телефона: {phone}")
            return {
                'success': False,
                'error': 'Неверный номер телефона'
            }
            
        except FloodWaitError as e:
            logger.error(f"Превышен лимит запросов для {phone}. Ожидание: {e.seconds} сек")
            return {
                'success': False,
                'error': f'Превышен лимит запросов. Попробуйте через {e.seconds} секунд'
            }
            
        except Exception as e:
            logger.error(f"Ошибка при отправке кода через Telegram для {phone}: {str(e)}")
            return {
                'success': False,
                'error': 'Ошибка при отправке кода через Telegram'
            }
    
    async def verify_telegram_code(self, phone: str, code: str, phone_code_hash: str = None) -> Dict[str, Any]:
        """
        Проверка кода подтверждения от Telegram.
        
        Args:
            phone: Номер телефона
            code: Код подтверждения
            phone_code_hash: Хеш кода от Telegram API
            
        Returns:
            Dict с результатом проверки
        """
        if phone not in self._verification_codes:
            return {
                'success': False,
                'error': 'Код не был запрошен для этого номера'
            }
        
        verification_data = self._verification_codes[phone]
        
        # Проверка срока действия кода
        if datetime.utcnow() > verification_data['expires_at']:
            del self._verification_codes[phone]
            return {
                'success': False,
                'error': 'Код истек'
            }
        
        if not self.enabled:
            # Режим разработки
            if verification_data['code'] == code:
                del self._verification_codes[phone]
                return {
                    'success': True,
                    'message': 'Код подтвержден (режим разработки)',
                    'dev_mode': True
                }
            else:
                return {
                    'success': False,
                    'error': 'Неверный код'
                }
        
        try:
            client = self._get_client(phone)
            
            if not client.is_connected():
                await client.connect()
            
            # Проверка кода через Telegram API
            result = await client(SignInRequest(
                phone_number=phone,
                phone_code_hash=verification_data['phone_code_hash'],
                phone_code=code
            ))
            
            # Получение информации о пользователе Telegram
            user_info = {
                'phone': phone,
                'telegram_id': result.user.id if hasattr(result, 'user') else None
            }
            
            # Очистка данных после успешной проверки
            del self._verification_codes[phone]
            
            # Отключение клиента после успешной авторизации для экономии ресурсов
            await self.disconnect_client(phone)
            
            logger.info(f"Код успешно подтвержден через Telegram для {phone}")
            
            return {
                'success': True,
                'message': 'Код успешно подтвержден',
                'user_info': user_info
            }
            
        except SessionPasswordNeededError:
            # Требуется двухфакторная аутентификация
            logger.warning(f"Требуется пароль 2FA для {phone}")
            return {
                'success': False,
                'error': 'Требуется пароль двухфакторной аутентификации',
                'requires_2fa': True
            }
            
        except Exception as e:
            logger.error(f"Ошибка при проверке кода для {phone}: {str(e)}")
            return {
                'success': False,
                'error': 'Неверный код подтверждения'
            }
    
    async def cleanup_expired_codes(self):
        """Очистка истекших кодов подтверждения."""
        current_time = datetime.utcnow()
        expired_phones = [
            phone for phone, data in self._verification_codes.items()
            if current_time > data['expires_at']
        ]
        
        for phone in expired_phones:
            del self._verification_codes[phone]
            logger.info(f"Удален истекший код для {phone}")
    
    async def disconnect_client(self, phone: str):
        """Отключение клиента для номера телефона."""
        if phone in self._clients:
            try:
                await self._clients[phone].disconnect()
            except Exception as e:
                logger.error(f"Ошибка при отключении клиента для {phone}: {str(e)}")
            finally:
                del self._clients[phone]
                # Также очищаем коды для этого номера
                if phone in self._verification_codes:
                    del self._verification_codes[phone]
    
    async def disconnect_all_clients(self):
        """Отключение всех клиентов."""
        for phone, client in self._clients.items():
            try:
                await client.disconnect()
            except Exception as e:
                logger.error(f"Ошибка при отключении клиента для {phone}: {str(e)}")
        
        self._clients.clear()
        self._verification_codes.clear()

# Глобальный экземпляр сервиса
telegram_service = TelegramAuthService()