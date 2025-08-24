import React, { useState, useEffect } from 'react'
import { 
  Truck, 
  CheckCircle, 
  Package,
  Phone,
  MapPin,
  User,
  RefreshCw,
  Clock,
  Navigation
} from 'lucide-react'
import { courierAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import OrderDetailsModal from '../../components/common/OrderDetailsModal'
import { toast } from 'react-hot-toast'
import styles from './CourierDashboard.module.css'

function CourierDashboard() {
  const [myOrders, setMyOrders] = useState([])
  const [availableOrders, setAvailableOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('my') // 'my' или 'available'

  useEffect(() => {
    fetchOrders()
    // Обновляем заказы каждые 30 секунд
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      setRefreshing(true)
      const [myOrdersResponse, availableOrdersResponse] = await Promise.all([
        courierAPI.getAssignedOrders(),
        courierAPI.getAvailableOrders()
      ])
      
      setMyOrders(myOrdersResponse.data)
      setAvailableOrders(availableOrdersResponse.data)
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
      toast.error('Ошибка загрузки заказов')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const takeOrder = async (orderId) => {
    try {
      await courierAPI.takeOrder(orderId)
      
      // Перемещаем заказ из доступных в мои
      const takenOrder = availableOrders.find(order => order.id === orderId)
      if (takenOrder) {
        setMyOrders(prev => [...prev, { ...takenOrder, status: 'delivering' }])
        setAvailableOrders(prev => prev.filter(order => order.id !== orderId))
      }
      
      toast.success('Заказ взят в доставку')
    } catch (error) {
      console.error('Ошибка взятия заказа:', error)
      toast.error('Ошибка взятия заказа')
    }
  }

  const markDelivered = async (orderId) => {
    try {
      await courierAPI.markDelivered(orderId)
      
      setMyOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'delivered' } : order
      ))
      
      toast.success('Заказ доставлен!')
    } catch (error) {
      console.error('Ошибка отметки доставки:', error)
      toast.error('Ошибка отметки доставки')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <Package className={styles.statusIcon} />
      case 'delivering': return <Truck className={styles.statusIcon} />
      case 'delivered': return <CheckCircle className={styles.statusIcon} />
      default: return <Clock className={styles.statusIcon} />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return 'Готов к доставке'
      case 'delivering': return 'Доставляется'
      case 'delivered': return 'Доставлен'
      default: return status
    }
  }

  const getStatusClass = (status) => {
    return styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`] || styles.statusReady
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

  const openInMaps = (address) => {
    const encodedAddress = encodeURIComponent(address)
    const mapsUrl = `https://maps.google.com/maps?q=${encodedAddress}`
    window.open(mapsUrl, '_blank')
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const currentOrders = activeTab === 'my' ? myOrders : availableOrders

  return (
    <div className={styles.courierDashboard}>
      <div className={styles.header}>
        <div>
          <h1>Курьер</h1>
          <p>Управление доставкой заказов</p>
        </div>
        <button 
          className={styles.refreshButton}
          onClick={fetchOrders}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? styles.spinning : ''} size={20} />
          Обновить
        </button>
      </div>

      {/* Вкладки */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'my' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('my')}
        >
          Мои заказы ({myOrders.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'available' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Доступные ({availableOrders.length})
        </button>
      </div>

      {/* Статистика */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {myOrders.filter(order => order.status === 'delivering').length}
          </div>
          <div className={styles.statLabel}>В доставке</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {myOrders.filter(order => order.status === 'delivered').length}
          </div>
          <div className={styles.statLabel}>Доставлено</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {availableOrders.length}
          </div>
          <div className={styles.statLabel}>Доступно</div>
        </div>
      </div>

      {/* Список заказов */}
      <div className={styles.ordersGrid}>
        {currentOrders.map(order => (
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
                  <div className={styles.addressRow}>
                    <span><MapPin size={14} /> {order.delivery_address}</span>
                    <button 
                      className={styles.mapsButton}
                      onClick={() => openInMaps(order.delivery_address)}
                      title="Открыть в картах"
                    >
                      <Navigation size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.orderItems}>
              {order.items && order.items.slice(0, 3).map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <span>{item.dish_name} x{item.quantity}</span>
                  <span>{item.total_price.toLocaleString()} ₸</span>
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <div className={styles.moreItems}>
                  +{order.items.length - 3} товаров
                </div>
              )}
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
                
                {activeTab === 'available' && (
                  <button 
                    className={`${styles.actionButton} ${styles.takeButton}`}
                    onClick={() => takeOrder(order.id)}
                  >
                    <Truck size={16} />
                    Взять заказ
                  </button>
                )}
                
                {activeTab === 'my' && order.status === 'delivering' && (
                  <button 
                    className={`${styles.actionButton} ${styles.deliveredButton}`}
                    onClick={() => markDelivered(order.id)}
                  >
                    <CheckCircle size={16} />
                    Доставлен
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentOrders.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <Truck size={48} />
          <h3>
            {activeTab === 'my' ? 'У вас нет заказов' : 'Нет доступных заказов'}
          </h3>
          <p>
            {activeTab === 'my' 
              ? 'Возьмите заказы из списка доступных' 
              : 'Все заказы уже взяты или ожидают готовности'
            }
          </p>
        </div>
      )}

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

export default CourierDashboard