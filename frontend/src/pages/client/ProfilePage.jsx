import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './ProfilePage.module.css'

function ProfilePage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    birth_day: '',
    birth_month: '',
    birth_year: '',
    birth_date: '',
    gender: '',
    newsletter_subscribed: false,
    sms_notifications: true
  })
  
  const [bonusEmail, setBonusEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Функция для загрузки профиля пользователя
  const loadUserProfile = async () => {
    if (!user) {
      setIsLoadingProfile(false)
      return
    }

    try {
      setIsLoadingProfile(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.log('Нет токена авторизации')
        setIsLoadingProfile(false)
        return
      }

      const response = await fetch('http://localhost:8000/users/me/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('Загружены данные пользователя:', userData)
        
        // Парсим дату рождения если она есть
        let birth_day = '', birth_month = '', birth_year = ''
        if (userData.birth_date) {
          const date = new Date(userData.birth_date)
          birth_day = date.getDate().toString()
          birth_month = (date.getMonth() + 1).toString()
          birth_year = date.getFullYear().toString()
        }

        setProfileData({
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          address: userData.address || '',
          birth_day,
          birth_month, 
          birth_year,
          birth_date: userData.birth_date || '',
          gender: userData.gender || '',
          newsletter_subscribed: userData.newsletter_subscribed || false,
          sms_notifications: userData.sms_notifications || true
        })
      } else {
        console.error('Ошибка загрузки профиля:', response.status)
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Загружаем профиль при монтировании компонента и изменении пользователя
  useEffect(() => {
    loadUserProfile()
  }, [user])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Автоматическое сохранение для checkbox подписки
    if (name === 'newsletter_subscribed' && type === 'checkbox') {
      setTimeout(() => handleNewsletterToggle(), 100)
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      // Формируем дату рождения из компонентов
      let birth_date = null
      if (profileData.birth_year && profileData.birth_month && profileData.birth_day) {
        const year = parseInt(profileData.birth_year)
        const month = parseInt(profileData.birth_month)
        const day = parseInt(profileData.birth_day)
        birth_date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      }
      
      // Подготавливаем данные для отправки
      const dataToSend = {
        name: profileData.name,
        email: profileData.email,
        address: profileData.address,
        gender: profileData.gender,
        newsletter_subscribed: profileData.newsletter_subscribed,
        sms_notifications: profileData.sms_notifications
      }
      
      // Добавляем дату рождения если она заполнена
      if (birth_date) {
        dataToSend.birth_date = birth_date
      }

      const response = await fetch('http://localhost:8000/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      })

      const responseData = await response.json()

      if (response.ok) {
        alert('Профиль успешно обновлен!')
        console.log('Профиль обновлен:', responseData)
        // Обновляем локальное состояние с данными от сервера
        setProfileData(prev => ({
          ...prev,
          ...responseData
        }))
      } else {
        alert(`Ошибка при обновлении профиля: ${responseData.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Ошибка при обновлении профиля')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!profileData.name.trim()) {
      alert('Пожалуйста, введите имя')
      return
    }
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('http://localhost:8000/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileData.name })
      })

      const responseData = await response.json()

      if (response.ok) {
        alert('Имя сохранено!')
        console.log('Имя обновлено:', responseData)
        // Обновляем локальное состояние данных пользователя
        setProfileData(prev => ({ ...prev, name: responseData.name }))
      } else {
        alert(`Ошибка при сохранении имени: ${responseData.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Error saving name:', error)
      alert('Ошибка при сохранении имени')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBirthDate = async () => {
    if (!profileData.birth_year || !profileData.birth_month || !profileData.birth_day) {
      alert('Пожалуйста, выберите полную дату рождения')
      return
    }
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      // Формируем дату рождения
      const year = parseInt(profileData.birth_year)
      const month = parseInt(profileData.birth_month)
      const day = parseInt(profileData.birth_day)
      const birth_date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      
      const response = await fetch('http://localhost:8000/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ birth_date })
      })

      const responseData = await response.json()

      if (response.ok) {
        alert('Дата рождения сохранена!')
        console.log('Дата рождения обновлена:', responseData)
        // Обновляем локальное состояние
        setProfileData(prev => ({ ...prev, birth_date: birth_date }))
      } else {
        alert(`Ошибка при сохранении даты: ${responseData.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Error saving birth date:', error)
      alert('Ошибка при сохранении даты рождения')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewsletterToggle = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('http://localhost:8000/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newsletter_subscribed: profileData.newsletter_subscribed })
      })

      const responseData = await response.json()

      if (response.ok) {
        const message = profileData.newsletter_subscribed ? 'Подписка активирована!' : 'Подписка отключена!'
        alert(message)
        console.log('Подписка обновлена:', responseData)
        // Обновляем локальное состояние
        setProfileData(prev => ({ 
          ...prev, 
          newsletter_subscribed: responseData.newsletter_subscribed
        }))
      } else {
        alert(`Ошибка при обновлении подписки: ${responseData.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Error updating newsletter subscription:', error)
      alert('Ошибка при обновлении подписки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBonusSubscription = async () => {
    if (!bonusEmail) return
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8000/users/me/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: bonusEmail })
      })

      const responseData = await response.json()
      
      if (response.ok) {
        alert('Подписка оформлена успешно!')
        setShowBonusModal(false)
        setBonusEmail('')
        setProfileData(prev => ({ 
          ...prev, 
          email: responseData.email || bonusEmail, 
          newsletter_subscribed: true 
        }))
      } else {
        alert(`Ошибка при оформлении подписки: ${responseData.detail || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('Ошибка при оформлении подписки')
    } finally {
      setIsLoading(false)
    }
  }

  // Если пользователь не авторизован
  if (!user && !isLoadingProfile) {
    return (
      <div className={styles.profileContainer}>
        <div className="container">
          <div className={styles.loadingContainer}>
            <h2>Необходима авторизация</h2>
            <p>Для просмотра профиля необходимо войти в систему</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.profileContainer}>
      <div className="container">
        <div className={styles.profileHeader}>
          <div className={styles.headerLeft}>
            <h1>Личный кабинет</h1>
            <p>Профиль пользователя и история заказов</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Клиент</span>
              <span className={styles.userBadge}>
                {isLoadingProfile ? 'Загрузка...' : (profileData.name || 'Пользователь')}
              </span>
              <button className={styles.logoutBtn} onClick={() => logout && logout()}>
                Выйти
              </button>
            </div>
          </div>
        </div>

        <div className={styles.profileContent}>
          {isLoadingProfile ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Загрузка профиля...</p>
            </div>
          ) : (
            <>
          {/* Бонусы */}
          <section className={styles.bonusSection}>
            <div className={styles.sectionHeader}>
              <h2>Бонусы</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowBonusModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.bonusContent}>
              <p>Сообщим по почте о бонусах, акциях и новых продуктах</p>
              <div className={styles.bonusForm}>
                <input
                  type="email"
                  placeholder="Почта"
                  value={bonusEmail}
                  onChange={(e) => setBonusEmail(e.target.value)}
                  className={styles.bonusInput}
                />
                <button 
                  className={styles.subscribeBtn}
                  onClick={handleBonusSubscription}
                  disabled={isLoading}
                >
                  Подписаться
                </button>
              </div>
              <button className={styles.privacyBtn}>
                Все наши акции
              </button>
            </div>
          </section>

          {/* Личные данные */}
          <section className={styles.personalSection}>
            <h2>Личные данные</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Имя</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  placeholder="Введите имя"
                  className={styles.formInput}
                />
                <button className={styles.changeBtn} onClick={handleSaveName} disabled={isLoading}>
                  {isLoading ? 'Сохранение...' : 'Изменить'}
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>Номер телефона</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  readOnly
                  placeholder="Номер телефона"
                  className={`${styles.formInput} ${styles.readOnlyInput}`}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Дата рождения</label>
                <div className={styles.dateInputs}>
                  <select 
                    name="birth_day" 
                    value={profileData.birth_day}
                    className={styles.dateSelect}
                    onChange={handleInputChange}
                  >
                    <option value="">День</option>
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <select 
                    name="birth_month" 
                    value={profileData.birth_month}
                    className={styles.dateSelect}
                    onChange={handleInputChange}
                  >
                    <option value="">Месяц</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <select 
                    name="birth_year" 
                    value={profileData.birth_year}
                    className={styles.dateSelect}
                    onChange={handleInputChange}
                  >
                    <option value="">Год</option>
                    {[...Array(50)].map((_, i) => {
                      const year = new Date().getFullYear() - i
                      return <option key={year} value={year}>{year}</option>
                    })}
                  </select>
                </div>
                <button className={styles.saveBtn} onClick={handleSaveBirthDate} disabled={isLoading}>
                  {isLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>Пол</label>
                <div className={styles.genderInputs}>
                  <select 
                    name="gender"
                    value={profileData.gender}
                    onChange={handleInputChange}
                    className={styles.genderSelect}
                  >
                    <option value="">Выберите</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                </div>
                <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </section>

          {/* Подписки */}
          <section className={styles.subscriptionSection}>
            <h2>Подписки</h2>
            <div className={styles.subscriptionItem}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="newsletter_subscribed"
                  checked={profileData.newsletter_subscribed}
                  onChange={handleInputChange}
                />
                <span className={styles.checkmark}></span>
                Подписаться на рассылку
              </label>
              <p>Пользовательское соглашение</p>
            </div>
          </section>

          {/* История заказов */}
          <section className={styles.orderSection}>
            <h2>История заказов</h2>
            <p>Последние 90 дней заказов не было</p>
            <button className={styles.exitBtn} onClick={() => logout && logout()}>
              Выйти
            </button>
          </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage