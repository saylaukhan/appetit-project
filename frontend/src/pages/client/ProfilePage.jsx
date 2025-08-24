import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAddress } from '../../hooks/useAddress'
import { MapPin, Edit2, Plus, User, Calendar, Phone, Mail, Package, Clock, CheckCircle, XCircle, Truck, CreditCard, Wallet, Eye } from 'lucide-react'
import AddressModal from '../../components/common/AddressModal'
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal'
import OrderDetailsModal from '../../components/common/OrderDetailsModal'
import Toast from '../../components/common/Toast'
import styles from './ProfilePage.module.css'

function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    birth_day: '',
    birth_month: '',
    birth_year: '',
    birth_date: ''
  })
  
  const [editingBirthDate, setEditingBirthDate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userAddressData, setUserAddressData] = useState(null)
  const [orders, setOrders] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })
  
  const { getUserAddress, saveUserAddress, deleteUserAddress } = useAddress()

  // Функция для показа уведомлений
  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

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

      const response = await fetch('http://localhost:8000/api/v1/users/me/profile', {
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
          birth_date: userData.birth_date || ''
        })

        // Загружаем данные адреса
        try {
          const addressData = await getUserAddress()
          setUserAddressData(addressData)
        } catch (error) {
          console.error('Ошибка загрузки адреса:', error)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Ошибка загрузки профиля:', response.status, errorData)
        if (response.status === 401) {
          console.warn('Сессия истекла')
          logout && logout()
        }
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
    if (activeTab === 'orders') {
      loadOrders()
    }
  }, [user])

  // Загружаем заказы при переключении на вкладку заказов
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      loadOrders()
    }
  }, [activeTab, user])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    

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
        address: profileData.address
      }
      
      // Добавляем дату рождения если она заполнена
      if (birth_date) {
        dataToSend.birth_date = birth_date
      }

      const response = await fetch('http://localhost:8000/api/v1/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      })

      const responseData = await response.json()

      if (response.ok) {
        console.log('Профиль обновлен:', responseData)
        // Обновляем локальное состояние с данными от сервера
        setProfileData(prev => ({
          ...prev,
          ...responseData
        }))
        // Обновляем AuthContext
        updateUser(responseData)
        showToast('Профиль успешно обновлен!')
      } else {
        console.error(`Ошибка при обновлении профиля: ${responseData.detail || 'Неизвестная ошибка'}`)
        showToast(`Ошибка при обновлении профиля: ${responseData.detail || 'Неизвестная ошибка'}`, 'error')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!profileData.name.trim()) {
      console.warn('Имя не указано')
      return
    }
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('http://localhost:8000/api/v1/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileData.name })
      })

      const responseData = await response.json()

      if (response.ok) {
        console.log('Имя обновлено:', responseData)
        // Обновляем локальное состояние данных пользователя
        setProfileData(prev => ({ ...prev, name: responseData.name }))
        // Обновляем AuthContext для отображения в хедере
        updateUser({ name: responseData.name })
        showToast('Имя успешно сохранено!')
      } else {
        console.error(`Ошибка при сохранении имени: ${responseData.detail || 'Неизвестная ошибка'}`)
        showToast(`Ошибка при сохранении имени: ${responseData.detail || 'Неизвестная ошибка'}`, 'error')
      }
    } catch (error) {
      console.error('Error saving name:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditBirthDate = () => {
    setEditingBirthDate(true)
  }

  const handleSaveBirthDate = async () => {
    if (!profileData.birth_year || !profileData.birth_month || !profileData.birth_day) {
      console.warn('Не все поля даты рождения заполнены')
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
      
      const response = await fetch('http://localhost:8000/api/v1/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ birth_date })
      })

      const responseData = await response.json()

      if (response.ok) {
        console.log('Дата рождения обновлена:', responseData)
        setProfileData(prev => ({ ...prev, birth_date: birth_date }))
        setEditingBirthDate(false)
        // Обновляем AuthContext
        updateUser({ birth_date: birth_date })
        showToast('Дата рождения успешно сохранена!')
      } else {
        console.error(`Ошибка при сохранении даты: ${responseData.detail || 'Неизвестная ошибка'}`)
        showToast(`Ошибка при сохранении даты: ${responseData.detail || 'Неизвестная ошибка'}`, 'error')
      }
    } catch (error) {
      console.error('Error saving birth date:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBirthDate = () => {
    // Возвращаем исходные значения
    const birthDate = profileData.birth_date
    if (birthDate) {
      const date = new Date(birthDate)
      setProfileData(prev => ({
        ...prev,
        birth_day: date.getDate().toString(),
        birth_month: (date.getMonth() + 1).toString(),
        birth_year: date.getFullYear().toString()
      }))
    } else {
      setProfileData(prev => ({
        ...prev,
        birth_day: '',
        birth_month: '',
        birth_year: ''
      }))
    }
    setEditingBirthDate(false)
  }

  const handleEditAddress = () => {
    setShowAddressModal(true)
  }

  const handleSaveAddress = async (addressData) => {
    try {
      // Сохраняем адрес
      await saveUserAddress(addressData)

      // Получаем обновленные данные с сервера
      const updatedAddressData = await getUserAddress()

      // Обновляем локальные данные
      setUserAddressData(updatedAddressData)
      setProfileData(prev => ({
        ...prev,
        address: updatedAddressData?.address || addressData.address
      }))

      setShowAddressModal(false)
      showToast('Адрес успешно сохранен!')
    } catch (error) {
      console.error('Ошибка сохранения адреса:', error)
      showToast('Ошибка сохранения адреса. Попробуйте снова.', 'error')
    }
  }

  const handleDeleteAddressClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDeleteAddress = async () => {
    try {
      await deleteUserAddress()
      
      // Обновляем локальные данные
      setUserAddressData(null)
      setProfileData(prev => ({
        ...prev,
        address: ''
      }))
      
      setShowDeleteConfirm(false)
      showToast('Адрес успешно удален!')
    } catch (error) {
      console.error('Ошибка удаления адреса:', error)
      showToast('Ошибка удаления адреса. Попробуйте снова.', 'error')
    }
  }

  // Функции для работы с заказами
  const loadOrders = async () => {
    if (!user) return

    setIsLoadingOrders(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8000/api/v1/users/me/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const ordersData = await response.json()
        setOrders(ordersData)
      } else {
        console.error('Ошибка загрузки заказов:', response.status)
        const errorText = await response.text()
        console.error('Детали ошибки:', errorText)
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleOrderDetails = (order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false)
    setSelectedOrder(null)
  }

  const cancelOrder = async (orderId) => {
    if (!user || cancellingOrder === orderId) return

    setCancellingOrder(orderId)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Обновляем статус заказа в локальном состоянии
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' }
            : order
        ))
        showToast('Заказ успешно отменен!')
      } else {
        const errorData = await response.json()
        showToast(errorData.detail || 'Ошибка отмены заказа', 'error')
      }
    } catch (error) {
      console.error('Ошибка отмены заказа:', error)
      showToast('Ошибка отмены заказа', 'error')
    } finally {
      setCancellingOrder(null)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className={styles.statusIconPending} />
      case 'confirmed':
        return <CheckCircle size={16} className={styles.statusIconConfirmed} />
      case 'preparing':
        return <Package size={16} className={styles.statusIconPreparing} />
      case 'ready':
        return <Truck size={16} className={styles.statusIconReady} />
      case 'delivered':
        return <CheckCircle size={16} className={styles.statusIconDelivered} />
      case 'cancelled':
        return <XCircle size={16} className={styles.statusIconCancelled} />
      default:
        return <Clock size={16} />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Ожидает подтверждения'
      case 'confirmed':
        return 'Подтвержден'
      case 'preparing':
        return 'Готовится'
      case 'ready':
        return 'Готов к выдаче'
      case 'delivered':
        return 'Доставлен'
      case 'cancelled':
        return 'Отменен'
      default:
        return 'Неизвестно'
    }
  }

  const canCancelOrder = (status) => {
    return ['pending', 'confirmed'].includes(status)
  }

  const handleSaveEmail = async () => {
    if (!profileData.email || !profileData.email.trim()) {
      console.warn('Email не указан')
      return
    }
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch('http://localhost:8000/api/v1/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: profileData.email })
      })

      const responseData = await response.json()

      if (response.ok) {
        console.log('Email обновлен:', responseData)
        setProfileData(prev => ({ ...prev, email: responseData.email }))
        // Обновляем AuthContext
        updateUser({ email: responseData.email })
        showToast('Email успешно сохранен!')
      } else {
        console.error(`Ошибка при сохранении email: ${responseData.detail || 'Неизвестная ошибка'}`)
        showToast(`Ошибка при сохранении email: ${responseData.detail || 'Неизвестная ошибка'}`, 'error')
      }
    } catch (error) {
      console.error('Error saving email:', error)
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
            {/* Навигация по вкладкам */}
            <div className={styles.tabNavigation}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'personal' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <User size={20} />
                Личные данные
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <Package size={20} />
                История заказов
              </button>
            </div>

            {activeTab === 'personal' && (
              <>
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
                <small className={styles.fieldNote}>Номер телефона нельзя изменить</small>
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  placeholder="Введите email"
                  className={styles.formInput}
                />
                <button className={styles.changeBtn} onClick={handleSaveEmail} disabled={isLoading}>
                  {isLoading ? 'Сохранение...' : 'Изменить'}
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>Дата рождения</label>
                {!editingBirthDate ? (
                  <>
                    <div className={styles.birthDateDisplay}>
                      {profileData.birth_date ? 
                        new Date(profileData.birth_date).toLocaleDateString('ru-RU') : 
                        'Дата рождения не указана'
                      }
                    </div>
                    <button className={styles.changeBtn} onClick={handleEditBirthDate}>
                      Изменить
                    </button>
                  </>
                ) : (
                  <>
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
                    <div className={styles.buttonGroup}>
                      <button className={styles.saveBtn} onClick={handleSaveBirthDate} disabled={isLoading}>
                        {isLoading ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button className={styles.cancelBtn} onClick={handleCancelBirthDate} disabled={isLoading}>
                        Отмена
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Адрес доставки</label>
                <div className={styles.addressDisplay}>
                  {userAddressData?.has_address ? (
                    <div className={styles.addressInfo}>
                      <div className={styles.addressText}>
                        {userAddressData.address}
                      </div>
                      {userAddressData.address_apartment && (
                        <div className={styles.addressDetails}>
                          Кв. {userAddressData.address_apartment}
                          {userAddressData.address_entrance && `, подъезд ${userAddressData.address_entrance}`}
                          {userAddressData.address_floor && `, этаж ${userAddressData.address_floor}`}
                        </div>
                      )}
                      {userAddressData.address_comment && (
                        <div className={styles.addressComment}>
                          Комментарий: {userAddressData.address_comment}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.noAddress}>
                      Адрес доставки не указан
                    </div>
                  )}
                </div>
                <div className={styles.addressActions}>
                  <button className={styles.changeBtn} onClick={handleEditAddress}>
                    {userAddressData?.has_address ? 'Изменить' : 'Добавить адрес'}
                  </button>
                  {userAddressData?.has_address && (
                    <button 
                      className={styles.deleteBtn} 
                      onClick={handleDeleteAddressClick}
                      title="Удалить адрес"
                    >
                      Удалить адрес
                    </button>
                  )}
                </div>
              </div>

            </div>
          </section>
              </>
            )}

            {activeTab === 'orders' && (
              <>
                {/* История заказов */}
                <section className={styles.orderSection}>
                  <h2>История заказов</h2>
                  
                  {isLoadingOrders ? (
                    <div className={styles.loadingContainer}>
                      <div className={styles.loadingSpinner}></div>
                      <p>Загрузка заказов...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className={styles.emptyOrders}>
                      <Package size={48} className={styles.emptyIcon} />
                      <h3>У вас пока нет заказов</h3>
                      <p>Заказы появятся здесь после их оформления</p>
                    </div>
                  ) : (
                    <div className={styles.ordersGrid}>
                      {orders.map(order => (
                        <div key={order.id} className={styles.orderCard}>
                          <div className={styles.orderHeader}>
                            <div className={styles.orderInfo}>
                              <span className={styles.orderNumber}>Заказ #{order.order_number}</span>
                              <span className={styles.orderDate}>
                                {new Date(order.created_at).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className={styles.orderStatus}>
                              {getStatusIcon(order.status)}
                              <span className={styles.statusText}>{getStatusText(order.status)}</span>
                            </div>
                          </div>
                          
                          <div className={styles.orderDetails}>
                            <div className={styles.orderMeta}>
                              <div className={styles.deliveryInfo}>
                                {order.delivery_type === 'delivery' ? (
                                  <>
                                    <Truck size={16} />
                                    <span>Доставка</span>
                                  </>
                                ) : (
                                  <>
                                    <Package size={16} />
                                    <span>Самовывоз</span>
                                  </>
                                )}
                              </div>
                              <div className={styles.paymentInfo}>
                                {order.payment_method === 'card' ? (
                                  <>
                                    <CreditCard size={16} />
                                    <span>Карта</span>
                                  </>
                                ) : (
                                  <>
                                    <Wallet size={16} />
                                    <span>Наличные</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {order.delivery_address && (
                              <div className={styles.addressInfo}>
                                <MapPin size={16} />
                                <span>{order.delivery_address}</span>
                              </div>
                            )}
                            
                            <div className={styles.orderItems}>
                              {order.items.map((item, index) => (
                                <div key={index} className={styles.orderItem}>
                                  <span className={styles.itemName}>
                                    {item.dish_name} × {item.quantity}
                                  </span>
                                  <span className={styles.itemPrice}>{item.total_price} ₸</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className={styles.orderFooter}>
                            <div className={styles.totalAmount}>
                              Итого: <strong>{order.total_amount} ₸</strong>
                            </div>
                            <div className={styles.orderActions}>
                              <button 
                                className={styles.detailsBtn}
                                onClick={() => handleOrderDetails(order)}
                              >
                                <Eye size={16} />
                                Подробнее
                              </button>
                              {canCancelOrder(order.status) && (
                                <button 
                                  className={styles.cancelOrderBtn}
                                  onClick={() => cancelOrder(order.id)}
                                  disabled={cancellingOrder === order.id}
                                >
                                  {cancellingOrder === order.id ? 'Отмена...' : 'Отменить заказ'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
            </>
          )}
        </div>

        {/* Модальное окно для адреса */}
        <AddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSave={handleSaveAddress}
          initialAddress={userAddressData}
        />

        {/* Модальное окно подтверждения удаления адреса */}
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDeleteAddress}
          title="Удаление адреса"
          message="Вы действительно хотите удалить адрес? Это действие нельзя отменить."
          confirmText="Удалить адрес"
          cancelText="Отмена"
          isLoading={isLoading}
        />

        {/* Модальное окно деталей заказа */}
        <OrderDetailsModal
          isOpen={showOrderDetails}
          onClose={handleCloseOrderDetails}
          order={selectedOrder}
        />

        {/* Компонент уведомлений */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    </div>
  )
}

export default ProfilePage