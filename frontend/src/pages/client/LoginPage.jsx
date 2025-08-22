import React, { useState, useEffect } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Phone, Lock, User, AlertCircle, Loader, CheckCircle, Copy } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './LoginPage.module.css'

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [verificationStep, setVerificationStep] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [inputCode, setInputCode] = useState('')

  const { login, initRegistration, verifyRegistrationCode, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Если пользователь уже авторизован, перенаправляем его
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  // Очистка кода при выходе со страницы регистрации
  useEffect(() => {
    return () => {
      if (verificationStep) {
        setVerificationStep(false)
        setVerificationCode('')
        setInputCode('')
      }
    }
  }, [location.pathname])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^\+7\d{10}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Валидация
      if (!validatePhone(formData.phone)) {
        setError('Введите корректный номер телефона в формате +77001234567')
        return
      }

      if (formData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов')
        return
      }

      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают')
        return
      }

      if (!isLogin && formData.name.length < 2) {
        setError('Введите имя (минимум 2 символа)')
        return
      }

      if (isLogin) {
        // Вход в систему
        const success = await login(formData.phone, formData.password)
        if (!success) {
          setError('Неверный номер телефона или пароль')
        }
        // После успешного входа пользователь будет перенаправлен автоматически через Navigate выше
      } else {
        // Новый процесс регистрации - инициализация с получением кода
        const result = await initRegistration(formData.phone, formData.name, formData.password)
        if (result.success) {
          setVerificationCode(result.data.verification_code)
          setVerificationStep(true)
        } else {
          setError(result.error || 'Ошибка регистрации')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (inputCode.length !== 4) {
        setError('Введите 4-значный код')
        return
      }

      const success = await verifyRegistrationCode(formData.phone, inputCode)
      if (success) {
        // Явное перенаправление после успешной регистрации
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setError('Неверный код верификации')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      phone: '',
      password: '',
      name: '',
      confirmPassword: ''
    })
    setVerificationStep(false)
    setVerificationCode('')
    setInputCode('')
    setError('')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(verificationCode)
  }

  // Быстрый вход для тестирования
  const quickLogin = async (role) => {
    setLoading(true)
    const testAccounts = {
      admin: { phone: '+77771234567', password: 'admin123' },
      kitchen: { phone: '+77772345678', password: 'kitchen123' },
      courier: { phone: '+77773456789', password: 'courier123' },
      client: { phone: '+77774567890', password: 'client123' }
    }
    
    const account = testAccounts[role]
    const success = await login(account.phone, account.password)
    
    if (!success) {
      setError('Ошибка входа в тестовый аккаунт')
    }
    setLoading(false)
  }

  if (verificationStep) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <img src="/src/assets/Logo APPETIT.png" alt="APPETIT" className={styles.logo} />
            <h1>Подтверждение регистрации</h1>
            <p>Введите 4-значный код для завершения регистрации</p>
          </div>

          {/* Баннер с кодом верификации */}
          <div className={styles.verificationBanner}>
            <div className={styles.bannerHeader}>
              <CheckCircle size={20} className={styles.successIcon} />
              <span>Код верификации сгенерирован</span>
            </div>
            <div className={styles.codeDisplay}>
              <span className={styles.code}>{verificationCode}</span>
              <button 
                type="button" 
                onClick={copyCodeToClipboard}
                className={styles.copyButton}
                title="Скопировать код"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className={styles.bannerNote}>
              Этот код действителен только для текущей сессии регистрации
            </p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleVerificationSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="inputCode">Введите код верификации</label>
              <input
                type="text"
                id="inputCode"
                name="inputCode"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                required
                className={styles.input}
                autoComplete="one-time-code"
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className={styles.spinner} />
                  Проверяем код...
                </>
              ) : (
                'Подтвердить регистрацию'
              )}
            </button>
          </form>

          <div className={styles.backLink}>
            <button onClick={() => setVerificationStep(false)}>
              ← Назад к регистрации
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <img src="/src/assets/Logo APPETIT.png" alt="APPETIT" className={styles.logo} />
          <h1>{isLogin ? 'Вход в систему' : 'Регистрация'}</h1>
          <p>
            {isLogin 
              ? 'Введите свой номер телефона и пароль' 
              : 'Создайте новый аккаунт для заказа еды'
            }
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="phone">Номер телефона</label>
            <div className={styles.inputWithIcon}>
              <Phone size={18} className={styles.inputIcon} />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+77001234567"
                required
                className={styles.input}
                autoComplete="tel"
              />
            </div>
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="name">Имя</label>
              <div className={styles.inputWithIcon}>
                <User size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ваше имя"
                  required
                  className={styles.input}
                  autoComplete="given-name"
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="password">Пароль</label>
            <div className={styles.inputWithIcon}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Минимум 6 символов"
                required
                className={styles.input}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Подтвердите пар��ль</label>
              <div className={styles.inputWithIcon}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Повторите пароль"
                  required
                  className={styles.input}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className={styles.spinner} />
                {isLogin ? 'Входим...' : 'Регистрируем...'}
              </>
            ) : (
              <>
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </>
            )}
          </button>
        </form>

        <div className={styles.toggleMode}>
          {isLogin ? (
            <p>
              Нет аккаунта?{' '}
              <button onClick={toggleMode} className={styles.linkButton}>
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{' '}
              <button onClick={toggleMode} className={styles.linkButton}>
                Войти
              </button>
            </p>
          )}
        </div>

        <div className={styles.backToHome}>
          <Link to="/">← Вернуться на главную</Link>
        </div>

        {/* Быстрый вход для демо */}
        <div className={styles.demoSection}>
          <p className={styles.demoTitle}>Быстрый вход (демо):</p>
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
      </div>
    </div>
  )
}

export default LoginPage