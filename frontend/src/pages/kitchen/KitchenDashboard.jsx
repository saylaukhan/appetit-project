import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  ChefHat,
  Timer,
  Bell,
  RefreshCw
} from 'lucide-react'
import { kitchenAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './KitchenDashboard.module.css'

function KitchenDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState({
    pending: 0,
    cooking: 0,
    ready: 0,
    avgTime: 0
  })

  useEffect(() => {
    fetchKitchenOrders()
    
    // Обновляем время каждую секунду
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Автообновление заказов каждые 30 секунд
    const ordersInterval = setInterval(() => {
      fetchKitchenOrders()
    }, 30000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(ordersInterval)
    }
  }, [])

  useEffect(() => {
    // Пересчитываем статистику при изменении заказов
    const pending = orders.filter(order => order.status === 'pending').length
    const cooking = orders.filter(order => order.status === 'cooking').length
    const ready = orders.filter(order => order.status === 'ready').length
    
    // Рассчитываем среднее время приготовления
    const cookingOrders = orders.filter(order => order.status === 'cooking')
    const avgTime = cookingOrders.length > 0 
      ? cookingOrders.reduce((sum, order) => sum + getElapsedMinutes(order.cookingStarted), 0) / cookingOrders.length
      : 0

    setStats({ pending, cooking, ready, avgTime: Math.round(avgTime) })
  }, [orders])

  const fetchKitchenOrders = async () => {
    try {
      // В реальном приложении здесь будет API вызов
      // const response = await kitchenAPI.getKitchenOrders()
      
      // Пока используем моковые данные
      const mockOrders = [
        {
          id: 1,
          orderNumber: '0001',
          customer: 'Айгуль К.',
          items: [
            { name: 'Пицца Маргарита', quantity: 1, notes: 'Без лука' },
            { name: 'Кока-Кола 0.5л', quantity: 2, notes: '' }
          ],
          status: 'pending',
          priority: 'normal',
          deliveryType: 'delivery',
          createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
          estimatedTime: 25,
          tableNumber: null
        },
        {
          id: 2,
          orderNumber: '0002', 
          customer: 'Арман Т.',
          items: [
            { name: 'Бургер Классик', quantity: 2, notes: 'Средней прожарки' },
            { name: 'Картофель фри', quantity: 1, notes: 'Без соли' }
          ],
          status: 'cooking',
          priority: 'high',
          deliveryType: 'delivery',
          createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          cookingStarted: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          estimatedTime: 15,
          tableNumber: null
        },
        {
          id: 3,
          orderNumber: '0003',
          customer: 'Жанар С.',
          items: [
            { name: 'Ролл Филадельфия', quantity: 3, notes: '' },
            { name: 'Зеленый чай', quantity: 1, notes: 'Горячий' }
          ],
          status: 'ready',
          priority: 'normal',
          deliveryType: 'pickup',
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          cookingStarted: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
          completedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          estimatedTime: 20,
          tableNumber: null
        },
        {
          id: 4,
          orderNumber: '0004',
          customer: 'Стол №12',
          items: [
            { name: 'Салат Цезарь', quantity: 1, notes: 'Без сухариков' },
            { name: 'Борщ украинский', quantity: 1, notes: '' }
          ],
          status: 'cooking',
          priority: 'normal',
          deliveryType: 'dine_in',
          createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          cookingStarted: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
          estimatedTime: 12,
          tableNumber: 12
        }
      ]
      
      setOrders(mockOrders)
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки заказов кухни:', error)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // В реальном приложении здесь будет API вызов
      // await kitchenAPI.updateOrderStatus(orderId, newStatus)
      
      const now = new Date().toISOString()
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updates = { status: newStatus }
          
          if (newStatus === 'cooking' && order.status === 'pending') {
            updates.cookingStarted = now
          } else if (newStatus === 'ready') {
            updates.completedAt = now
          }
          
          return { ...order, ...updates }
        }
        return order
      }))
    } catch (error) {
      console.error('Ошибка обновления статуса заказа:', error)
    }
  }

  const getElapsedMinutes = (startTime) => {
    if (!startTime) return 0
    const elapsed = (new Date() - new Date(startTime)) / 1000 / 60
    return Math.floor(elapsed)
  }

  const getOrderElapsed = (order) => {
    if (order.status === 'ready' && order.completedAt) {
      return getElapsedMinutes(order.cookingStarted)
    }
    if (order.status === 'cooking' && order.cookingStarted) {
      return getElapsedMinutes(order.cookingStarted)
    }
    return getElapsedMinutes(order.createdAt)
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return styles.priorityHigh
      case 'normal': return styles.priorityNormal
      case 'low': return styles.priorityLow
      default: return styles.priorityNormal
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending
      case 'cooking': return styles.statusCooking
      case 'ready': return styles.statusReady
      default: return styles.statusPending
    }
  }

  const getDeliveryTypeIcon = (deliveryType) => {
    switch (deliveryType) {
      case 'delivery': return '🚗'
      case 'pickup': return '🚶'
      case 'dine_in': return '🏠'
      default: return '📦'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.kitchenDashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ChefHat className={styles.headerIcon} />
          <div>
            <h1>Kitchen Display System</h1>
            <p>{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <button 
            className={styles.refreshButton}
            onClick={() => fetchKitchenOrders()}
          >
            <RefreshCw size={18} />
            Обновить
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <Clock className={styles.statIcon} />
          <div>
            <div className={styles.statNumber}>{stats.pending}</div>
            <div className={styles.statLabel}>Ожидают</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <ChefHat className={styles.statIcon} />
          <div>
            <div className={styles.statNumber}>{stats.cooking}</div>
            <div className={styles.statLabel}>Готовятся</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <CheckCircle className={styles.statIcon} />
          <div>
            <div className={styles.statNumber}>{stats.ready}</div>
            <div className={styles.statLabel}>Готовы</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <Timer className={styles.statIcon} />
          <div>
            <div className={styles.statNumber}>{stats.avgTime}м</div>
            <div className={styles.statLabel}>Среднее время</div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className={styles.ordersContainer}>
        <div className={styles.ordersColumn}>
          <h2 className={styles.columnTitle}>
            <Clock size={20} />
            Новые заказы ({stats.pending})
          </h2>
          {orders.filter(order => order.status === 'pending').map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={updateOrderStatus}
              getElapsedMinutes={() => getElapsedMinutes(order.createdAt)}
              getPriorityClass={getPriorityClass}
              getDeliveryTypeIcon={getDeliveryTypeIcon}
              styles={styles}
            />
          ))}
        </div>

        <div className={styles.ordersColumn}>
          <h2 className={styles.columnTitle}>
            <ChefHat size={20} />
            В приготовлении ({stats.cooking})
          </h2>
          {orders.filter(order => order.status === 'cooking').map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={updateOrderStatus}
              getElapsedMinutes={() => getElapsedMinutes(order.cookingStarted)}
              getPriorityClass={getPriorityClass}
              getDeliveryTypeIcon={getDeliveryTypeIcon}
              styles={styles}
              showCookingTimer={true}
            />
          ))}
        </div>

        <div className={styles.ordersColumn}>
          <h2 className={styles.columnTitle}>
            <CheckCircle size={20} />
            Готовы к выдаче ({stats.ready})
          </h2>
          {orders.filter(order => order.status === 'ready').map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={updateOrderStatus}
              getElapsedMinutes={() => getElapsedMinutes(order.completedAt)}
              getPriorityClass={getPriorityClass}
              getDeliveryTypeIcon={getDeliveryTypeIcon}
              styles={styles}
              isReady={true}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Компонент карточки заказа
function OrderCard({ 
  order, 
  onStatusChange, 
  getElapsedMinutes, 
  getPriorityClass, 
  getDeliveryTypeIcon,
  styles,
  showCookingTimer = false,
  isReady = false
}) {
  const elapsed = getElapsedMinutes()
  const isOvertime = elapsed > order.estimatedTime

  return (
    <div className={`${styles.orderCard} ${getPriorityClass(order.priority)}`}>
      <div className={styles.orderHeader}>
        <div className={styles.orderInfo}>
          <span className={styles.orderNumber}>#{order.orderNumber}</span>
          <span className={styles.deliveryType}>
            {getDeliveryTypeIcon(order.deliveryType)}
          </span>
        </div>
        
        <div className={styles.orderTime}>
          <span className={`${styles.elapsed} ${isOvertime ? styles.overtime : ''}`}>
            {elapsed}м
          </span>
          <span className={styles.estimated}>/ {order.estimatedTime}м</span>
        </div>
      </div>

      <div className={styles.customer}>
        {order.tableNumber ? `Стол №${order.tableNumber}` : order.customer}
      </div>

      <div className={styles.orderItems}>
        {order.items.map((item, index) => (
          <div key={index} className={styles.orderItem}>
            <span className={styles.itemQuantity}>{item.quantity}x</span>
            <span className={styles.itemName}>{item.name}</span>
            {item.notes && (
              <div className={styles.itemNotes}>📝 {item.notes}</div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.orderActions}>
        {order.status === 'pending' && (
          <button
            className={`${styles.actionButton} ${styles.startButton}`}
            onClick={() => onStatusChange(order.id, 'cooking')}
          >
            <ChefHat size={16} />
            Начать готовить
          </button>
        )}
        
        {order.status === 'cooking' && (
          <button
            className={`${styles.actionButton} ${styles.readyButton}`}
            onClick={() => onStatusChange(order.id, 'ready')}
          >
            <CheckCircle size={16} />
            Готово
          </button>
        )}

        {isReady && (
          <div className={styles.readyIndicator}>
            <Bell className={styles.bellIcon} />
            К выдаче!
          </div>
        )}
      </div>
    </div>
  )
}

export default KitchenDashboard