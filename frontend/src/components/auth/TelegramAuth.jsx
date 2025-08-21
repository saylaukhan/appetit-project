import React, { useState } from 'react'
import { Phone, MessageCircle, AlertCircle, Loader } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './TelegramAuth.module.css'

function TelegramAuth({ onSuccess, onCancel }) {
  const [step, setStep] = useState('phone') // 'phone', 'code', 'name'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [phoneCodeHash, setPhoneCodeHash] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)

  const { requestTelegramCode, verifyTelegramCode } = useAuth()

  const validatePhone = (phone) => {
    const phoneRegex = /^\+7\d{10}$/
    return phoneRegex.test(phone)
  }

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!validatePhone(phone)) {
        setError('Введите корректный номер телефона в формате +77001234567')
        return
      }

      const result = await requestTelegramCode(phone)
      
      if (result.success) {
        setPhoneCodeHash(result.phone_code_hash)
        setStep('code')
        
        // В режиме разработки автоматически заполняем код
        if (result.dev_code) {
          setCode(result.dev_code)
        }
      } else {
        setError(result.error || 'Ошибка отправки кода')
      }
    } catch (error) {
      console.error('Telegram auth error:', error)
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (code.length < 4) {
        setError('Введите код подтверждения')
        return
      }

      const success = await verifyTelegramCode(phone, code, phoneCodeHash, name)
      
      if (success) {
        onSuccess && onSuccess()
      } else {
        // Если ошибка связана с тем, что нужно имя для нового пользователя
        const errorMessage = error.toLowerCase()
        if (errorMessage.includes('имя') || errorMessage.includes('name')) {
          setIsNewUser(true)
          setStep('name')
        }
      }
    } catch (error) {
      console.error('Telegram verification error:', error)
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleNameSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (name.length < 2) {
        setError('Введите имя (минимум 2 символа)')
        return
      }

      const success = await verifyTelegramCode(phone, code, phoneCodeHash, name)
      
      if (success) {
        onSuccess && onSuccess()
      }
    } catch (error) {
      console.error('Telegram name submission error:', error)
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'code') {
      setStep('phone')
      setCode('')
      setPhoneCodeHash('')
    } else if (step === 'name') {
      setStep('code')
      setName('')
    }
    setError('')
  }

  if (step === 'phone') {
    return (
      <div className={styles.telegramAuth}>
        <div className={styles.header}>
          <MessageCircle size={32} className={styles.telegramIcon} />
          <h2>Вход через Telegram</h2>
          <p>Введите номер телефона, привязанный к вашему аккаунту Telegram</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handlePhoneSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="telegram-phone">Номер телефона</label>
            <div className={styles.inputWithIcon}>
              <Phone size={18} className={styles.inputIcon} />
              <input
                type="tel"
                id="telegram-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+77001234567"
                required
                className={styles.input}
                autoComplete="tel"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className={styles.spinner} />
                Отправляем код...
              </>
            ) : (
              <>
                <MessageCircle size={18} />
                Получить код в Telegram
              </>
            )}
          </button>
        </form>

        <div className={styles.backLink}>
          <button onClick={onCancel} className={styles.linkButton}>
            ← Назад к обычному входу
          </button>
        </div>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <div className={styles.telegramAuth}>
        <div className={styles.header}>
          <MessageCircle size={32} className={styles.telegramIcon} />
          <h2>Код из Telegram</h2>
          <p>Введите код, который пришел в Telegram на номер {phone}</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleCodeSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="telegram-code">Код подтверждения</label>
            <input
              type="text"
              id="telegram-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              className={`${styles.input} ${styles.codeInput}`}
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
              'Подтвердить'
            )}
          </button>
        </form>

        <div className={styles.backLink}>
          <button onClick={handleBack} className={styles.linkButton}>
            ← Изменить номер телефона
          </button>
        </div>
      </div>
    )
  }

  if (step === 'name') {
    return (
      <div className={styles.telegramAuth}>
        <div className={styles.header}>
          <MessageCircle size={32} className={styles.telegramIcon} />
          <h2>Добро пожаловать!</h2>
          <p>Это ваш первый вход. Пожалуйста, укажите ваше имя</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleNameSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="telegram-name">Ваше имя</label>
            <input
              type="text"
              id="telegram-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              required
              className={styles.input}
              autoComplete="given-name"
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
                Завершаем регистрацию...
              </>
            ) : (
              'Завершить регистрацию'
            )}
          </button>
        </form>

        <div className={styles.backLink}>
          <button onClick={handleBack} className={styles.linkButton}>
            ← Назад к коду
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default TelegramAuth