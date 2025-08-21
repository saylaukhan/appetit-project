import React, { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const TelegramLoginWidget = ({ botUsername = "appetit_bot", className = "" }) => {
  const { telegramAuth } = useAuth()

  useEffect(() => {
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
    script.setAttribute('data-telegram-login', botUsername)
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
  }, [botUsername, telegramAuth])

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

