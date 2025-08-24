import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, User } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './OrderTrackingPage.module.css'

function OrderTrackingPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Функция для загрузки заказа
  const loadOrder = async () => {
    if (!orderId || !user) {
      setError('Заказ не найден')
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/api/v1/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else if (response.status === 404) {
        setError('Заказ не найден')
      } else {
        setError('Ошибка загрузки заказа')
      }
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error)
      setError('Ошибка подключения к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId, user])

  // Функция для получения статуса заказа с иконкой
  const getOrderStatus = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Ожидает подтверждения', icon: Clock, color: '#f59e0b' }
      case 'confirmed':
        return { text: 'Подтверждён', icon: CheckCircle, color: '#10b981' }
      case 'preparing':
        return { text: 'Готовится', icon: Package, color: '#3b82f6' }
      case 'ready':
        return { text: 'Готов к выдаче', icon: CheckCircle, color: '#10b981' }
      case 'delivering':
        return { text: 'Доставляется', icon: Truck, color: '#3b82f6' }
      case 'delivered':
        return { text: 'Доставлен', icon: CheckCircle, color: '#10b981' }
      case 'cancelled':
        return { text: 'Отменён', icon: Package, color: '#ef4444' }
      default:
        return { text: 'Неизвестный статус', icon: Package, color: '#6b7280' }
    }
  }

  if (!user) {
    navigate('/login')
    return null
  }

  if (isLoading) {
    return (
      <div className={styles.trackingContainer}>
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.trackingContainer}>
        <div className="container">
          <div className={styles.errorMessage}>
            <h2>Ошибка</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/profile')} className={styles.backButton}>
              Вернуться в профиль
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className={styles.trackingContainer}>
        <div className="container">
          <p>Заказ не найден</p>
        </div>
      </div>
    )
  }

  const status = getOrderStatus(order.status)
  const StatusIcon = status.icon

  return (
    <div className={styles.trackingContainer}>
      <div className="container">
        <div className={styles.orderHeader}>
          <h1>Заказ {order.order_number}</h1>
          <div className={styles.orderStatus} style={{ color: status.color }}>
            <StatusIcon size={24} />
            <span>{status.text}</span>
          </div>
        </div>

        <div className={styles.orderInfo}>
          <div className={styles.infoSection}>
            <h3>Информация о заказе</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Сумма:</span>
                <span className={styles.infoValue}>{order.total_amount} ₸</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Способ получения:</span>
                <span className={styles.infoValue}>
                  {order.delivery_type === 'delivery' ? 'Доставка' : 'Самовывоз'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Способ оплаты:</span>
                <span className={styles.infoValue}>
                  {order.payment_method === 'card' ? 'Картой' : 'Наличными'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Дата создания:</span>
                <span className={styles.infoValue}>
                  {new Date(order.created_at).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          {order.delivery_address && (
            <div className={styles.infoSection}>
              <h3>Адрес доставки</h3>
              <div className={styles.addressInfo}>
                <MapPin size={20} />
                <span>{order.delivery_address}</span>
              </div>
            </div>
          )}

          {order.items && (
            <div className={styles.infoSection}>
              <h3>Состав заказа</h3>
              <div className={styles.orderItems}>
                {order.items.map((item, index) => (
                  <div key={index} className={styles.orderItem}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.dish_name}</span>
                      <span className={styles.itemQuantity}>x{item.quantity}</span>
                    </div>
                    <div className={styles.itemPrice}>{item.total_price} ₸</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.customer_name && (
            <div className={styles.infoSection}>
              <h3>Контактная информация</h3>
              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <User size={20} />
                  <span>{order.customer_name}</span>
                </div>
                <div className={styles.contactItem}>
                  <Phone size={20} />
                  <span>{order.customer_phone}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button 
            onClick={() => navigate('/profile')} 
            className={styles.backButton}
          >
            Вернуться в профиль
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderTrackingPage