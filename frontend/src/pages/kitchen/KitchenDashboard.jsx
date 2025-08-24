import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package,
  Phone,
  MapPin,
  User,
  RefreshCw
} from 'lucide-react'
import { kitchenAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import OrderDetailsModal from '../../components/common/OrderDetailsModal'
import { toast } from 'react-hot-toast'
import styles from './KitchenDashboard.module.css'

function KitchenDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
    // Обновляем заказы каждые 30 секунд
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      setRefreshing(true)
      const response = await kitchenAPI.getKitchenOrders()
      setOrders(response.data)
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
      toast.error('Ошибка загрузки заказов')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const startCooking = async (orderId) => {
    try {
      await kitchenAPI.startCooking(orderId)
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'preparing' } : order
      ))
      
      toast.success('Заказ взят в работу')
    } catch (error) {
      console.error('Ошибка начала приготовления:', error)
      toast.error('Ошибка начала приготовления')
    }
  }

  const markReady = async (orderId) => {
    try {
      await kitchenAPI.markOrderReady(orderId)
      
      // Обновляем статус заказа в локальном состоянии
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'ready' } : order
      ))
      
      toast.success('Заказ готов!')
    } catch (error) {
      console.error('Ошибка отметки готовности:', error)
      toast.error('Ошибка отметки готовности')
    }
  }

  const completePickup = async (orderId) => {
    try {
      await kitchenAPI.completePickupOrder(orderId)
      
      // Удаляем заказ из списка, так как он выполнен
      setOrders(prev => prev.filter(order => order.id !== orderId))
      
      toast.success('Заказ выдан клиенту!')
    } catch (error) {
      console.error('Ошибка выдачи заказа:', error)
      toast.error('Ошибка выдачи заказа')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <Clock className={styles.statusIcon} />
      case 'preparing': return <Package className={styles.statusIcon} />
      case 'ready': return <CheckCircle className={styles.statusIcon} />
      default: return <Clock className={styles.statusIcon} />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Подтвержден'
      case 'preparing': return 'Готовится'
      case 'ready': return 'Готов'
      default: return status
    }
  }

  const getStatusClass = (status) => {
    return styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`] || styles.statusConfirmed
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 60) {
      return `${minutes} мин назад`
    }
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `${hours} ч назад`
    }
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.kitchenDashboard}>
      <div className={styles.header}>
        <h1>Кухня</h1>
        <p>Управление приготовлением заказов</p>
        <button 
          className={styles.refreshButton}
          onClick={fetchOrders}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? styles.spinning : ''} size={20} />
          Обновить
        </button>
      </div>

      {/* Статистика */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {orders.filter(order => order.status === 'confirmed').length}
          </div>
          <div className={styles.statLabel}>Ожидают</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {orders.filter(order => order.status === 'preparing').length}
          </div>
          <div className={styles.statLabel}>Готовятся</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {orders.filter(order => order.status === 'ready' && order.delivery_type === 'pickup').length}
          </div>
          <div className={styles.statLabel}>Готовы к выдаче</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {orders.length}
          </div>
          <div className={styles.statLabel}>Всего</div>
        </div>
      </div>

      {/* Список заказов в двух колонках */}
      <div className={styles.ordersColumns}>
        {/* Колонка ожидающих заказов */}
        <div className={styles.orderColumn}>
          <div className={styles.columnHeader}>
            <Clock size={20} />
            <h2>Ожидают приготовления</h2>
            <span className={styles.columnCount}>
              {orders.filter(order => order.status === 'confirmed').length}
            </span>
          </div>
          <div className={styles.columnContent}>
            {orders.filter(order => order.status === 'confirmed').map(order => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderNumber}>#{order.order_number}</span>
                    <span className={styles.orderTime}>{formatTime(order.created_at)}</span>
                  </div>
                  <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </div>
                </div>

                <div className={styles.customerInfo}>
                  <h3>{order.customer_name}</h3>
                  <div className={styles.customerDetails}>
                    <span><Phone size={14} /> {order.customer_phone}</span>
                    {order.delivery_address && (
                      <span><MapPin size={14} /> {order.delivery_address}</span>
                    )}
                  </div>
                </div>

                <div className={styles.orderItems}>
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.dish_name}</span>
                        <span className={styles.itemQuantity}>x{item.quantity}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className={styles.itemModifiers}>
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <strong>Итого: {order.total_amount.toLocaleString()} ₸</strong>
                  </div>
                  
                  <div className={styles.orderActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Package size={16} />
                      Подробнее
                    </button>
                    
                    <button 
                      className={`${styles.actionButton} ${styles.startButton}`}
                      onClick={() => startCooking(order.id)}
                    >
                      <AlertCircle size={16} />
                      Начать готовить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {orders.filter(order => order.status === 'confirmed').length === 0 && (
              <div className={styles.emptyColumn}>
                <Clock size={32} />
                <p>Нет заказов, ожидающих приготовления</p>
              </div>
            )}
          </div>
        </div>

        {/* Колонка готовящихся заказов */}
        <div className={styles.orderColumn}>
          <div className={styles.columnHeader}>
            <Package size={20} />
            <h2>В процессе готовки</h2>
            <span className={styles.columnCount}>
              {orders.filter(order => order.status === 'preparing').length}
            </span>
          </div>
          <div className={styles.columnContent}>
            {orders.filter(order => order.status === 'preparing').map(order => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderNumber}>#{order.order_number}</span>
                    <span className={styles.orderTime}>{formatTime(order.created_at)}</span>
                  </div>
                  <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </div>
                </div>

                <div className={styles.customerInfo}>
                  <h3>{order.customer_name}</h3>
                  <div className={styles.customerDetails}>
                    <span><Phone size={14} /> {order.customer_phone}</span>
                    {order.delivery_address && (
                      <span><MapPin size={14} /> {order.delivery_address}</span>
                    )}
                  </div>
                </div>

                <div className={styles.orderItems}>
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.dish_name}</span>
                        <span className={styles.itemQuantity}>x{item.quantity}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className={styles.itemModifiers}>
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <strong>Итого: {order.total_amount.toLocaleString()} ₸</strong>
                  </div>
                  
                  <div className={styles.orderActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Package size={16} />
                      Подробнее
                    </button>
                    
                    <button 
                      className={`${styles.actionButton} ${styles.readyButton}`}
                      onClick={() => markReady(order.id)}
                    >
                      <CheckCircle size={16} />
                      Готов
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {orders.filter(order => order.status === 'preparing').length === 0 && (
              <div className={styles.emptyColumn}>
                <Package size={32} />
                <p>Нет заказов в процессе готовки</p>
              </div>
            )}
          </div>
        </div>

        {/* Колонка готовых заказов на самовывоз */}
        <div className={styles.orderColumn}>
          <div className={styles.columnHeader}>
            <CheckCircle size={20} />
            <h2>Готовы к выдаче</h2>
            <span className={styles.columnCount}>
              {orders.filter(order => order.status === 'ready' && order.delivery_type === 'pickup').length}
            </span>
          </div>
          <div className={styles.columnContent}>
            {orders.filter(order => order.status === 'ready' && order.delivery_type === 'pickup').map(order => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderNumber}>#{order.order_number}</span>
                    <span className={styles.orderTime}>{formatTime(order.created_at)}</span>
                  </div>
                  <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </div>
                </div>

                <div className={styles.customerInfo}>
                  <h3>{order.customer_name}</h3>
                  <div className={styles.customerDetails}>
                    <span><Phone size={14} /> {order.customer_phone}</span>
                    <div className={styles.pickupBadge}>
                      <User size={14} />
                      Самовывоз
                    </div>
                  </div>
                </div>

                <div className={styles.orderItems}>
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.dish_name}</span>
                        <span className={styles.itemQuantity}>x{item.quantity}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className={styles.itemModifiers}>
                          {item.modifiers.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <strong>Итого: {order.total_amount.toLocaleString()} ₸</strong>
                  </div>
                  
                  <div className={styles.orderActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Package size={16} />
                      Подробнее
                    </button>
                    
                    <button 
                      className={`${styles.actionButton} ${styles.completeButton}`}
                      onClick={() => completePickup(order.id)}
                    >
                      <CheckCircle size={16} />
                      Выдан
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {orders.filter(order => order.status === 'ready' && order.delivery_type === 'pickup').length === 0 && (
              <div className={styles.emptyColumn}>
                <CheckCircle size={32} />
                <p>Нет заказов, готовых к выдаче</p>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Модальное окно деталей заказа */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      )}
    </div>
  )
}

export default KitchenDashboard