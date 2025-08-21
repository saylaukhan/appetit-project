import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { User, AlertCircle, Loader, Phone } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import TelegramLoginWidget from '../../components/common/TelegramLoginWidget'
import useAuthConfig from '../../hooks/useAuthConfig'
import styles from './LoginPage.module.css'

function LoginPage() {
  const [showSMSAuth, setShowSMSAuth] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { isAuthenticated, requestSMS, verifySMS } = useAuth()
  const { sms_enabled } = useAuthConfig()
  const location = useLocation()
  
  // Если пользователь уже авторизован, перенаправляем его
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  // Запрос SMS кода
  const handleRequestSMS = async (e) => {
    e.preventDefault()
    if (!phone) {
      setError('Введите номер телефона')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await requestSMS(phone)
      if (success) {
        setCodeSent(true)
      }
    } catch (err) {
      setError('Ошибка отправки SMS кода')
    } finally {
      setLoading(false)
    }
  }

  // Подтверждение SMS кода
  const handleVerifySMS = async (e) => {
    e.preventDefault()
    if (!code) {
      setError('Введите код из SMS')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await verifySMS(phone, code)
      if (success) {
        // Авторизация прошла успешно, перенаправление происходит автоматически
      }
    } catch (err) {
      setError('Неверный код или код истек')
    } finally {
      setLoading(false)
    }
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

        {/* SMS авторизация */}
        {sms_enabled && (
          <div className={styles.smsSection}>
            {!showSMSAuth ? (
              <button 
                onClick={() => setShowSMSAuth(true)}
                className={styles.smsToggleButton}
                disabled={loading}
              >
                <Phone size={16} />
                Войти по SMS
              </button>
            ) : (
              <div className={styles.smsForm}>
                {!codeSent ? (
                  <form onSubmit={handleRequestSMS}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="phone">Номер телефона</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 (xxx) xxx-xx-xx"
                        disabled={loading}
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading || !phone}
                      className={styles.submitButton}
                    >
                      {loading ? <Loader className={styles.spinner} /> : 'Отправить код'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySMS}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="code">Код из SMS</label>
                      <input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Введите код из SMS"
                        disabled={loading}
                        maxLength={6}
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading || !code}
                      className={styles.submitButton}
                    >
                      {loading ? <Loader className={styles.spinner} /> : 'Подтвердить'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setCodeSent(false)
                        setCode('')
                      }}
                      className={styles.backButton}
                      disabled={loading}
                    >
                      Изменить номер
                    </button>
                  </form>
                )}
                <button 
                  onClick={() => {
                    setShowSMSAuth(false)
                    setCodeSent(false)
                    setPhone('')
                    setCode('')
                    setError('')
                  }}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Отмена
                </button>
              </div>
            )}
          </div>
        )}

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