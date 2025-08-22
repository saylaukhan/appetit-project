import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAddress } from '../../hooks/useAddress'
import CartItem from '../../components/cart/CartItem'
import PromoCodeInput from '../../components/cart/PromoCodeInput'
import DeliverySelector from '../../components/cart/DeliverySelector'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import AddressModal from '../../components/common/AddressModal'
import Toast from '../../components/common/Toast'
import styles from './CartPage.module.css'

function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    total,
    itemsCount,
    subtotal,
    discount,
    discountAmount,
    deliveryType,
    pickupAddress,
    promoCode,
    clearCart,
    setDeliveryType,
    setPickupAddress
  } = useCart()
  
  const { getUserAddress, saveUserAddress } = useAddress()
  
  const [isLoading, setIsLoading] = useState(false)
  const [userAddress, setUserAddress] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })

  const deliveryFee = deliveryType === 'delivery' ? 199 : 0
  const finalTotal = total + deliveryFee

  // Загружаем адрес пользователя при загрузке компонента
  useEffect(() => {
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
  }, [getUserAddress])

  const handleCheckout = async () => {
    if (items.length === 0) return
    
    setIsLoading(true)
    
    try {
      // Здесь будет логика оформления заказа
      await new Promise(resolve => setTimeout(resolve, 1000)) // Имитация запроса
      navigate('/checkout')
    } catch (error) {
      console.error('Ошибка при переходе к оформлению:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueShopping = () => {
    navigate('/menu')
  }

  // Функции для работы с уведомлениями
  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  // Обработчик редактирования адреса
  const handleEditAddress = () => {
    setShowAddressModal(true)
  }

  // Обработчик сохранения адреса
  const handleSaveAddress = async (addressData) => {
    try {
      setIsLoading(true)

      // Сохраняем адрес
      await saveUserAddress(addressData)

      // Получаем обновленные данные с сервера
      const updatedAddressData = await getUserAddress()

      // Обновляем локальные данные
      setUserAddress(updatedAddressData)
      setShowAddressModal(false)
      showToast('Адрес успешно сохранен!')
    } catch (error) {
      console.error('Ошибка сохранения адреса:', error)
      showToast('Ошибка сохранения адреса. Попробуйте снова.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className={styles.cartContainer}>
        <div className={styles.cartContent}>
          <div className={styles.emptyCart}>
            <div className={styles.emptyCartIcon}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17A2 2 0 0 1 15 19H9A2 2 0 0 1 7 17V13M17 13H7" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Ваша корзина пуста</h2>
            <p>Добавьте что-нибудь вкусное из нашего меню</p>
            <button 
              className={styles.continueButton}
              onClick={handleContinueShopping}
            >
              Перейти в меню
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartContent}>
        <div className={styles.cartHeader}>
          <h1>Корзина</h1>
          <span className={styles.itemCount}>
            {itemsCount} {itemsCount === 1 ? 'товар' : itemsCount < 5 ? 'товара' : 'товаров'}
          </span>
        </div>

        <div className={styles.cartLayout}>
          {/* Левая колонка - товары */}
          <div className={styles.cartItems}>
            <div className={styles.cartItemsList}>
              {items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <div className={styles.cartActions}>
              <button 
                className={styles.clearButton}
                onClick={clearCart}
              >
                Очистить корзину
              </button>
              <button 
                className={styles.continueShoppingButton}
                onClick={handleContinueShopping}
              >
                Продолжить покупки
              </button>
            </div>
          </div>

          {/* Правая колонка - итоги и оформление */}
          <div className={styles.cartSummary}>
            <div className={styles.summaryCard}>
              <h3>Ваш заказ</h3>
              
              <DeliverySelector
                selectedType={deliveryType}
                onTypeChange={setDeliveryType}
                userAddress={userAddress}
                pickupAddress={pickupAddress}
                onPickupAddressChange={setPickupAddress}
                onEditAddress={handleEditAddress}
              />

              <PromoCodeInput />

              <div className={styles.summaryDetails}>
                <div className={styles.summaryRow}>
                  <span>Сумма заказа:</span>
                  <span>{subtotal} ₸</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className={styles.summaryRow + ' ' + styles.discount}>
                    <span>Скидка {promoCode ? `(${promoCode})` : ''}:</span>
                    <span>-{discountAmount} ₸</span>
                  </div>
                )}
                
                <div className={styles.summaryRow}>
                  <span>Доставка:</span>
                  <span>{deliveryFee === 0 ? 'Бесплатно' : `${deliveryFee} ₸`}</span>
                </div>
                
                <div className={styles.summaryDivider}></div>
                
                <div className={styles.summaryRow + ' ' + styles.total}>
                  <span>Итого:</span>
                  <span>{finalTotal} ₸</span>
                </div>
              </div>

              <button 
                className={styles.checkoutButton}
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size={16} />
                    Оформляем...
                  </>
                ) : (
                  'К оформлению заказа'
                )}
              </button>

              <div className={styles.minOrderInfo}>
                <p>Минимальная сумма заказа: 1 500 ₸</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для редактирования адреса */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleSaveAddress}
        initialAddress={userAddress}
      />

      {/* Компонент уведомлений */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}

export default CartPage