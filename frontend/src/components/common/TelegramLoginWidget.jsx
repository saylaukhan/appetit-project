import React, { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import useAuthConfig from '../../hooks/useAuthConfig'

const TelegramLoginWidget = ({ className = "" }) => {
  const { telegramAuth } = useAuth()
  const { telegram_bot_username, telegram_enabled, loading } = useAuthConfig()

  useEffect(() => {
    // Ждем загрузки конфигурации
    if (loading || !telegram_enabled || !telegram_bot_username) {
      return
    }

    // Создаем уникальный callback для этого виджета
    const callbackName = `telegramLoginCallback_${Date.now()}`
    
    // Создаем глобальную функцию callback
    window[callbackName] = async (user) => {
      try {
        console.log('Telegram user data:', user)
        await telegramAuth(user)
      } catch (error) {
        console.error('Telegram auth error:', error)
      }
    }

    // Загружаем Telegram Widget Script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', telegram_bot_username)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', callbackName)
    script.setAttribute('data-request-access', 'write')
    script.async = true

    // Ищем контейнер и добавляем скрипт
    const container = document.getElementById('telegram-login-container')
    if (container) {
      container.innerHTML = '' // Очищаем контейнер
      container.appendChild(script)
    }

    // Cleanup при размонтировании
    return () => {
      if (window[callbackName]) {
        delete window[callbackName]
      }
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [telegram_bot_username, telegram_enabled, loading, telegramAuth])

  if (loading) {
    return (
      <div className={className}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50px'
        }}>
          Загрузка...
        </div>
      </div>
    )
  }

  if (!telegram_enabled) {
    return (
      <div className={className}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50px',
          color: '#666'
        }}>
          Авторизация через Telegram временно недоступна
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div 
        id="telegram-login-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50px'
        }}
      />
    </div>
  )
}

export default TelegramLoginWidget

