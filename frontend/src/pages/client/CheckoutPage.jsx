import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useAddress } from '../../hooks/useAddress'
import { CreditCard, Wallet, MapPin, Edit2, User, Phone, MessageSquare } from 'lucide-react'
import AddressModal from '../../components/common/AddressModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Toast from '../../components/common/Toast'
import styles from './CheckoutPage.module.css'

function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, total, deliveryType, clearCart, promoCode, discountAmount } = useCart()
  const { getUserAddress, saveUserAddress } = useAddress()
  
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  })
  const [guestData, setGuestData] = useState({
    name: '',
    phone: ''
  })
  const [userAddress, setUserAddress] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [orderComment, setOrderComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })

  const deliveryFee = deliveryType === 'delivery' ? 199 : 0
  const finalTotal = total + deliveryFee

  // Загружаем адрес пользователя при загрузке компонента
  useEffect(() => {
    if (user) {
      const loadUserAddress = async () => {
        try {
          const address = await getUserAddress()
          if (address && address.has_address) {
            setUserAddress(address)
          }
        } catch (error) {
          console.error('Ошибка загрузки адреса:', error)
        }
      }
      loadUserAddress()
    }
  }, [user, getUserAddress])

  // Перенаправляем на корзину если она пуста
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
    }
  }, [items.length, navigate])

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  const handleCardDataChange = (field, value) => {
    if (field === 'number') {
      // Форматирование номера карты
      value = value.replace(/\D/g, '').slice(0, 16)
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ')
    } else if (field === 'expiry') {
      // Форматирование даты истечения
      value = value.replace(/\D/g, '').slice(0, 4)
      if (value.length >= 3) {
        value = value.slice(0, 2) + '/' + value.slice(2)
      }
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3)
    }
    
    setCardData(prev => ({ ...prev, [field]: value }))
  }

  const handleGuestDataChange = (field, value) => {
    if (field === 'phone') {
      // Простое форматирование телефона
      value = value.replace(/\D/g, '').slice(0, 11)
      if (value.length > 0 && !value.startsWith('7')) {
        value = '7' + value
      }
    }
    setGuestData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveAddress = async (addressData) => {
    try {
      setIsLoading(true)
      await saveUserAddress(addressData)
      const updatedAddress = await getUserAddress()
      setUserAddress(updatedAddress)
      setShowAddressModal(false)
      showToast('Адрес успешно сохранен!')
    } catch (error) {
      console.error('Ошибка сохранения адреса:', error)
      showToast('Ошибка сохранения адреса. Попробуйте снова.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const validateOrder = () => {
    // Проверяем данные гостя если не авторизован
    if (!user) {
      if (!guestData.name.trim()) {
        showToast('Укажите ваше имя', 'error')
        return false
      }
      if (!guestData.phone.trim() || guestData.phone.length < 11) {
        showToast('Укажите корректный номер телефона', 'error')
        return false
      }
    }

    // Проверяем адрес для доставки
    if (deliveryType === 'delivery' && !userAddress?.has_address) {
      showToast('Для доставки необходимо указать адрес', 'error')
      return false
    }

    // Проверяем данные карты если выбрана оплата картой
    if (paymentMethod === 'card') {
      if (!cardData.number.replace(/\s/g, '') || cardData.number.replace(/\s/g, '').length < 16) {
        showToast('Укажите корректный номер карты', 'error')
        return false
      }
      if (!cardData.name.trim()) {
        showToast('Укажите имя держателя карты', 'error')
        return false
      }
      if (!cardData.expiry || cardData.expiry.length < 5) {
        showToast('Укажите срок действия карты', 'error')
        return false
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        showToast('Укажите CVV код', 'error')
        return false
      }
    }

    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateOrder()) return

    setIsLoading(true)
    try {
      // Подготавливаем данные заказа
      const orderData = {
        items: items.map(item => ({
          dish_id: item.dishId,
          quantity: item.quantity,
          modifiers: item.modifiers.map(mod => mod.id)
        })),
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        delivery_address: deliveryType === 'delivery' && userAddress ? userAddress.address : null,
        name: !user ? guestData.name : undefined,
        phone: !user ? '+7' + guestData.phone : undefined,
        comment: orderComment.trim() || undefined,
        promo_code: promoCode || undefined
      }

      // Отправляем заказ
      const token = localStorage.getItem('auth_token')
      const headers = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('http://localhost:8000/api/v1/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok) {
        // Заказ успешно создан
        clearCart()
        showToast('Заказ успешно оформлен!')
        
        // Перенаправляем на страницу отслеживания заказа
        setTimeout(() => {
          navigate(`/order/${result.id}`)
        }, 1500)
      } else {
        throw new Error(result.detail || 'Ошибка при создании заказа')
      }
    } catch (error) {
      console.error('Ошибка создания заказа:', error)
      showToast(error.message || 'Ошибка при создании заказа', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return null // Компонент перенаправит на корзину
  }

  return (
    <div className={styles.checkoutContainer}>
      <div className="container">
        <div className={styles.checkoutContent}>
          <div className={styles.checkoutHeader}>
            <h1>Оформление заказа</h1>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/cart')}
            >
              ← Назад к корзине
            </button>
          </div>

          <div className={styles.checkoutLayout}>
            {/* Основная форма */}
            <div className={styles.checkoutForm}>
              
              {/* Контактные данные для гостей */}
              {!user && (
                <div className={styles.formSection}>
                  <h3>
                    <User size={20} />
                    Ваши данные
                  </h3>
                  <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                      <label>Имя *</label>
                      <input
                        type="text"
                        placeholder="Введите ваше имя"
                        value={guestData.name}
                        onChange={(e) => handleGuestDataChange('name', e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Телефон *</label>
                      <div className={styles.phoneInput}>
                        <span>+7</span>
                        <input
                          type="text"
                          placeholder="771 234 5678"
                          value={guestData.phone.slice(1)}
                          onChange={(e) => handleGuestDataChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Адрес доставки */}
              {deliveryType === 'delivery' && (
                <div className={styles.formSection}>
                  <h3>
                    <MapPin size={20} />
                    Адрес доставки
                  </h3>
                  {userAddress && userAddress.has_address ? (
                    <div className={styles.addressCard}>
                      <div className={styles.addressInfo}>
                        <p className={styles.addressText}>{userAddress.address}</p>
                        {userAddress.entrance && (
                          <p className={styles.addressDetails}>
                            Подъезд: {userAddress.entrance}, Этаж: {userAddress.floor}, Кв: {userAddress.apartment}
                          </p>
                        )}
                      </div>
                      <button
                        className={styles.editButton}
                        onClick={() => setShowAddressModal(true)}
                      >
                        <Edit2 size={16} />
                        Изменить
                      </button>
                    </div>
                  ) : (
                    <div className={styles.noAddress}>
                      <p>Адрес не указан</p>
                      <button
                        className={styles.addAddressButton}
                        onClick={() => setShowAddressModal(true)}
                      >
                        <MapPin size={16} />
                        Добавить адрес
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Способ оплаты */}
              <div className={styles.formSection}>
                <h3>Способ оплаты</h3>
                <div className={styles.paymentMethods}>
                  <button
                    className={`${styles.paymentMethod} ${paymentMethod === 'card' ? styles.active : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={20} />
                    <span>Банковская карта</span>
                  </button>
                  <button
                    className={`${styles.paymentMethod} ${paymentMethod === 'cash' ? styles.active : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Wallet size={20} />
                    <span>Наличные</span>
                  </button>
                </div>

                {/* Форма карты */}
                {paymentMethod === 'card' && (
                  <div className={styles.cardForm}>
                    <div className={styles.cardInputGroup}>
                      <label>Номер карты *</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={(e) => handleCardDataChange('number', e.target.value)}
                        className={styles.cardNumber}
                      />
                    </div>
                    <div className={styles.cardInputGroup}>
                      <label>Имя держателя *</label>
                      <input
                        type="text"
                        placeholder="IVAN IVANOV"
                        value={cardData.name}
                        onChange={(e) => handleCardDataChange('name', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className={styles.cardRow}>
                      <div className={styles.cardInputGroup}>
                        <label>Срок действия *</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardData.expiry}
                          onChange={(e) => handleCardDataChange('expiry', e.target.value)}
                          className={styles.cardExpiry}
                        />
                      </div>
                      <div className={styles.cardInputGroup}>
                        <label>CVV *</label>
                        <input
                          type="password"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) => handleCardDataChange('cvv', e.target.value)}
                          className={styles.cardCvv}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Информация о наличных */}
                {paymentMethod === 'cash' && (
                  <div className={styles.cashInfo}>
                    <p>Оплата наличными при получении заказа</p>
                  </div>
                )}
              </div>

              {/* Комментарий к заказу */}
              <div className={styles.formSection}>
                <h3>
                  <MessageSquare size={20} />
                  Комментарий к заказу
                </h3>
                <textarea
                  placeholder="Дополнительные пожелания к заказу..."
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  className={styles.commentTextarea}
                  rows={3}
                />
              </div>
            </div>

            {/* Сводка заказа */}
            <div className={styles.orderSummary}>
              <div className={styles.summaryCard}>
                <h3>Ваш заказ</h3>
                
                <div className={styles.orderItems}>
                  {items.map(item => (
                    <div key={item.id} className={styles.orderItem}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        {item.modifiers.length > 0 && (
                          <span className={styles.itemModifiers}>
                            {item.modifiers.map(mod => mod.name).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className={styles.itemQuantity}>×{item.quantity}</div>
                      <div className={styles.itemPrice}>{item.price * item.quantity} ₸</div>
                    </div>
                  ))}
                </div>

                <div className={styles.orderTotals}>
                  <div className={styles.totalRow}>
                    <span>Сумма заказа:</span>
                    <span>{total} ₸</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className={`${styles.totalRow} ${styles.discount}`}>
                      <span>Скидка {promoCode ? `(${promoCode})` : ''}:</span>
                      <span>-{discountAmount} ₸</span>
                    </div>
                  )}
                  
                  <div className={styles.totalRow}>
                    <span>Доставка:</span>
                    <span>{deliveryFee === 0 ? 'Бесплатно' : `${deliveryFee} ₸`}</span>
                  </div>
                  
                  <div className={styles.divider}></div>
                  
                  <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                    <span>Итого:</span>
                    <span>{finalTotal} ₸</span>
                  </div>
                </div>

                <button
                  className={styles.placeOrderButton}
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size={16} />
                      Оформляем заказ...
                    </>
                  ) : (
                    `Оформить заказ на ${finalTotal} ₸`
                  )}
                </button>

                <div className={styles.paymentInfo}>
                  <p>Нажимая кнопку "Оформить заказ", вы соглашаетесь с условиями доставки</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для адреса */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleSaveAddress}
        initialAddress={userAddress}
      />

      {/* Уведомления */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}

export default CheckoutPage