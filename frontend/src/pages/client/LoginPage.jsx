import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { User, AlertCircle, Loader } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import TelegramLoginWidget from '../../components/common/TelegramLoginWidget'
import useAuthConfig from '../../hooks/useAuthConfig'
import styles from './LoginPage.module.css'

function LoginPage() {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  // Если пользователь уже авторизован, перенаправляем его
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }



  // Быстрый вход для тестирования
  const quickLogin = async (role) => {
    // Эта функция теперь использует старый метод только для демо
    console.log(`Demo login for role: ${role}`)
    // В реальности можно было бы создать тестовые Telegram аккаунты
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <img src="/assets/Logo APPETIT.png" alt="APPETIT" className={styles.logo} />
          <h1>Вход в систему</h1>
          <p>
            Войдите через Telegram для быстрого и безопасного доступа
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Telegram Login Widget */}
        <div className={styles.telegramSection}>
          <TelegramLoginWidget 
            className={styles.telegramWidget}
          />
          <p className={styles.telegramDescription}>
            Нажмите кнопку выше для входа через ваш аккаунт Telegram
          </p>
        </div>

        <div className={styles.divider}>
          <span>или</span>
        </div>



        {/* Альтернативный вход для демо */}
        <div className={styles.demoSection}>
          <p className={styles.demoTitle}>Демо-аккаунты для тестирования:</p>
          <div className={styles.demoButtons}>
            <button onClick={() => quickLogin('admin')} disabled={loading}>
              👨‍💼 Админ
            </button>
            <button onClick={() => quickLogin('kitchen')} disabled={loading}>
              👨‍🍳 Кухня
            </button>
            <button onClick={() => quickLogin('courier')} disabled={loading}>
              🚗 Курьер
            </button>
            <button onClick={() => quickLogin('client')} disabled={loading}>
              👤 Клиент
            </button>
          </div>
        </div>

        <div className={styles.backToHome}>
          <Link to="/">← Вернуться на главную</Link>
        </div>

        {/* Ссылка на инструкции по настройке Telegram бота */}
        <div className={styles.botSetupInfo}>
          <p className={styles.setupTitle}>
            Для администраторов:
          </p>
          <p className={styles.setupDescription}>
            Для настройки авторизации через Telegram создайте бота через{' '}
            <a 
              href="https://t.me/botfather" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.botFatherLink}
            >
              @BotFather
            </a>{' '}
            и укажите токен в настройках системы.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage