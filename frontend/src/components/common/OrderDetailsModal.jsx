import React from 'react'
import { X, Package, Clock, CheckCircle, Truck, MapPin, Phone, User, CreditCard, Wallet } from 'lucide-react'
import styles from './OrderDetailsModal.module.css'

function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null

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

  // Функция для получения прогресса заказа
  const getOrderProgress = (status, deliveryType) => {
    const steps = deliveryType === 'delivery' 
      ? [
          { key: 'pending', text: 'Принят', icon: Clock },
          { key: 'confirmed', text: 'Подтвержден', icon: CheckCircle },
          { key: 'preparing', text: 'Готовится', icon: Package },
          { key: 'ready', text: 'Готов', icon: CheckCircle },
          { key: 'delivering', text: 'Доставляется', icon: Truck },
          { key: 'delivered', text: 'Доставлен', icon: CheckCircle }
        ]
      : [
          { key: 'pending', text: 'Принят', icon: Clock },
          { key: 'confirmed', text: 'Подтвержден', icon: CheckCircle },
          { key: 'preparing', text: 'Готовится', icon: Package },
          { key: 'ready', text: 'Готов', icon: CheckCircle }
        ]

    const currentIndex = steps.findIndex(step => step.key === status)
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  const status = getOrderStatus(order.status)
  const StatusIcon = status.icon
  const progress = getOrderProgress(order.status, order.delivery_type)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 title={`Заказ ${order.order_number}`}>
            Заказ {order.order_number}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Статус заказа */}
          <div className={styles.orderStatus} style={{ color: status.color }}>
            <StatusIcon size={24} />
            <span>{status.text}</span>
          </div>

          {/* Индикатор прогресса */}
          <div className={styles.progressContainer}>
            <div className={styles.progressSteps}>
              {progress.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div key={step.key} className={styles.progressStep}>
                    <div 
                      className={`${styles.stepIcon} ${
                        step.completed ? styles.completed : ''
                      } ${step.current ? styles.current : ''}`}
                    >
                      <StepIcon size={20} />
                    </div>
                    <span 
                      className={`${styles.stepText} ${
                        step.completed ? styles.completedText : ''
                      }`}
                    >
                      {step.text}
                    </span>
                    {index < progress.length - 1 && (
                      <div 
                        className={`${styles.stepConnector} ${
                          step.completed ? styles.completedConnector : ''
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.orderInfo}>
            {/* Информация о заказе */}
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

            {/* Адрес доставки */}
            {order.delivery_address && (
              <div className={styles.infoSection}>
                <h3>Адрес доставки</h3>
                <div className={styles.addressInfo}>
                  <MapPin size={20} />
                  <div className={styles.addressDetails}>
                    <span>{order.delivery_address}</span>
                    {(order.delivery_entrance || order.delivery_floor || order.delivery_apartment) && (
                      <div className={styles.addressExtras}>
                        {[
                          order.delivery_entrance && `подъезд ${order.delivery_entrance}`,
                          order.delivery_floor && `этаж ${order.delivery_floor}`,
                          order.delivery_apartment && `кв. ${order.delivery_apartment}`
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {order.delivery_comment && (
                      <div className={styles.addressComment}>
                        Комментарий: {order.delivery_comment}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Состав заказа */}
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

            {/* Контактная информация */}
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
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsModal