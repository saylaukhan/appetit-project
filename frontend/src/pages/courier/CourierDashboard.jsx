import React, { useState, useEffect } from 'react'
import { 
  MapPin, 
  Phone, 
  Clock, 
  Package, 
  CheckCircle,
  Navigation,
  AlertCircle,
  DollarSign,
  User,
  MessageSquare,
  Camera,
  RefreshCw,
  Star
} from 'lucide-react'
import { courierAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './CourierDashboard.module.css'

function CourierDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    earnings: 0,
    rating: 0
  })
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchCourierOrders()
    getCurrentLocation()
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      fetchCourierOrders()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchCourierOrders = async () => {
    try {
      // В реальном приложении здесь будет API вызов
      // const response = await courierAPI.getAssignedOrders()
      
      // Пока используем моковые данные
      const mockOrders = [
        {
          id: 1,
          orderNumber: '0001',
          status: 'ready_for_pickup',
          customer: {
            name: 'Айгуль Казыбекова',
            phone: '+77774567890',
            address: 'ул. Абая 150, кв. 25, домофон 125',
            landmark: 'рядом с аптекой Сана',
            coordinates: { lat: 43.2220, lng: 76.8512 }
          },
          restaurant: {
            name: 'APPETIT на Сатпаева',
            address: 'ул. Сатпаева 90',
            phone: '+77771234567'
          },
          items: [
            { name: 'Пицца Маргарита', quantity: 1 },
            { name: 'Кока-Кола 0.5л', quantity: 2 }
          ],
          total: 3700,
          paymentMethod: 'card',
          deliveryFee: 500,
          distance: 3.2,
          estimatedTime: 25,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          notes: 'Позвонить за 5 минут до приезда'
        },
        {
          id: 2,
          orderNumber: '0002',
          status: 'delivering',
          customer: {
            name: 'Арман Токтасынов', 
            phone: '+77773456789',
            address: 'пр. Назарбаева 220, офис 15',
            landmark: 'бизнес-центр Нурлы Тау, 3 этаж',
            coordinates: { lat: 43.2567, lng: 76.9286 }
          },
          restaurant: {
            name: 'APPETIT на Сатпаева',
            address: 'ул. Сатпаева 90',
            phone: '+77771234567'
          },
          items: [
            { name: 'Бургер Классик', quantity: 2 },
            { name: 'Картофель фри', quantity: 1 }
          ],
          total: 5200,
          paymentMethod: 'cash',
          deliveryFee: 600,
          distance: 4.8,
          estimatedTime: 30,
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          pickedUpAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          notes: 'Без лука в бургере'
        },
        {
          id: 3,
          orderNumber: '0003',
          status: 'completed',
          customer: {
            name: 'Жанар Сапарова',
            phone: '+77785678901',
            address: 'ул. Розыбакиева 289, дом 12А',
            coordinates: { lat: 43.1945, lng: 76.8647 }
          },
          restaurant: {
            name: 'APPETIT на Сатпаева',
            address: 'ул. Сатпаева 90'
          },
          items: [
            { name: 'Ролл Филадельфия', quantity: 3 }
          ],
          total: 5600,
          paymentMethod: 'card',
          deliveryFee: 400,
          distance: 2.1,
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          rating: 5
        }
      ]
      
      setOrders(mockOrders)
      
      // Подсчет статистики
      const todayOrders = mockOrders.length
      const delivered = mockOrders.filter(o => o.status === 'completed').length
      const earnings = mockOrders.filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.deliveryFee, 0)
      const avgRating = mockOrders.filter(o => o.rating)
        .reduce((sum, o, _, arr) => sum + o.rating / arr.length, 0)
      
      setStats({
        total: todayOrders,
        delivered,
        earnings,
        rating: avgRating.toFixed(1)
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки заказов курьера:', error)
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Ошибка получения геолокации:', error)
        }
      )
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      // В реальном приложении здесь будет API вызов
      // await courierAPI.updateDeliveryStatus(orderId, status, currentLocation)
      
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updates = { status }
          if (status === 'delivering') {
            updates.pickedUpAt = new Date().toISOString()
          } else if (status === 'completed') {
            updates.completedAt = new Date().toISOString()
          }
          return { ...order, ...updates }
        }
        return order
      }))
    } catch (error) {
      console.error('Ошибка обновления статуса заказа:', error)
    }
  }

  const callCustomer = (phone) => {
    window.open(`tel:${phone}`)
  }

  const openMaps = (address, coordinates) => {
    // Используем универсальную схему для открытия карт (работает с картами по умолчанию на устройстве)
    if (coordinates) {
      const url = `geo:${coordinates.lat},${coordinates.lng}?q=${coordinates.lat},${coordinates.lng}(${encodeURIComponent(address)})`
      
      // Fallback для веб-браузеров - используем OpenStreetMap
      const fallbackUrl = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}&zoom=16#map=16/${coordinates.lat}/${coordinates.lng}`
      
      // Пытаемся открыть приложение карт, если не получается - используем веб
      window.open(url, '_blank') || window.open(fallbackUrl, '_blank')
    } else {
      // Для браузеров используем OpenStreetMap поиск
      const searchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
      window.open(searchUrl, '_blank')
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'ready_for_pickup': return 'Готов к получению'
      case 'picked_up': return 'Получен'
      case 'delivering': return 'В пути'
      case 'completed': return 'Доставлен'
      case 'cancelled': return 'Отменен'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready_for_pickup': return styles.statusReady
      case 'picked_up': return styles.statusPickedUp
      case 'delivering': return styles.statusDelivering
      case 'completed': return styles.statusCompleted
      case 'cancelled': return styles.statusCancelled
      default: return styles.statusReady
    }
  }

  const activeOrders = orders.filter(order => 
    ['ready_for_pickup', 'picked_up', 'delivering'].includes(order.status)
  )

  const completedOrders = orders.filter(order => order.status === 'completed')

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.courierDashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Курьер APPETIT</h1>
          <button 
            className={styles.refreshButton}
            onClick={fetchCourierOrders}
          >
            <RefreshCw size={18} />
          </button>
        </div>
        
        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Package className={styles.statIcon} />
            <div>
              <div className={styles.statNumber}>{stats.total}</div>
              <div className={styles.statLabel}>Заказов</div>
            </div>
          </div>
          
          <div className={styles.statItem}>
            <CheckCircle className={styles.statIcon} />
            <div>
              <div className={styles.statNumber}>{stats.delivered}</div>
              <div className={styles.statLabel}>Доставлено</div>
            </div>
          </div>
          
          <div className={styles.statItem}>
            <DollarSign className={styles.statIcon} />
            <div>
              <div className={styles.statNumber}>{stats.earnings}₸</div>
              <div className={styles.statLabel}>Заработано</div>
            </div>
          </div>
          
          <div className={styles.statItem}>
            <Star className={styles.statIcon} />
            <div>
              <div className={styles.statNumber}>{stats.rating}</div>
              <div className={styles.statLabel}>Рейтинг</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className={styles.section}>
          <h2>Активные заказы ({activeOrders.length})</h2>
          {activeOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={updateOrderStatus}
              onCallCustomer={callCustomer}
              onOpenMaps={openMaps}
              getStatusText={getStatusText}
              getStatusColor={getStatusColor}
              styles={styles}
            />
          ))}
        </div>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div className={styles.section}>
          <h2>Выполненные заказы ({completedOrders.length})</h2>
          {completedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={updateOrderStatus}
              onCallCustomer={callCustomer}
              onOpenMaps={openMaps}
              getStatusText={getStatusText}
              getStatusColor={getStatusColor}
              styles={styles}
              isCompleted={true}
            />
          ))}
        </div>
      )}

      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <Package size={64} />
          <h3>Заказов пока нет</h3>
          <p>Ожидайте назначения новых заказов</p>
        </div>
      )}
    </div>
  )
}

// Компонент карточки заказа для курьера
function OrderCard({ 
  order, 
  onStatusUpdate, 
  onCallCustomer, 
  onOpenMaps,
  getStatusText,
  getStatusColor,
  styles,
  isCompleted = false
}) {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ru', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getElapsedTime = () => {
    const now = new Date()
    const created = new Date(order.createdAt)
    const minutes = Math.floor((now - created) / 1000 / 60)
    return minutes
  }

  return (
    <div className={styles.orderCard}>
      <div className={styles.orderHeader}>
        <div className={styles.orderInfo}>
          <span className={styles.orderNumber}>#{order.orderNumber}</span>
          <span className={`${styles.orderStatus} ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>
        <div className={styles.orderMeta}>
          <span className={styles.orderTime}>
            <Clock size={14} />
            {formatTime(order.createdAt)}
          </span>
          {!isCompleted && (
            <span className={styles.elapsed}>
              {getElapsedTime()} мин назад
            </span>
          )}
        </div>
      </div>

      <div className={styles.customerInfo}>
        <div className={styles.customerHeader}>
          <User size={18} />
          <span className={styles.customerName}>{order.customer.name}</span>
        </div>
        
        <div className={styles.customerDetails}>
          <div className={styles.customerAddress}>
            <MapPin size={16} />
            <span>{order.customer.address}</span>
          </div>
          
          {order.customer.landmark && (
            <div className={styles.landmark}>
              📍 {order.customer.landmark}
            </div>
          )}
        </div>
      </div>

      <div className={styles.orderDetails}>
        <div className={styles.orderItems}>
          {order.items.map((item, index) => (
            <div key={index} className={styles.orderItem}>
              <span className={styles.itemQuantity}>{item.quantity}x</span>
              <span className={styles.itemName}>{item.name}</span>
            </div>
          ))}
        </div>
        
        <div className={styles.orderSummary}>
          <div className={styles.summaryRow}>
            <span>Сумма заказа:</span>
            <span>{(order.total - order.deliveryFee).toLocaleString()} ₸</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Доставка:</span>
            <span>{order.deliveryFee.toLocaleString()} ₸</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Итого:</span>
            <span>{order.total.toLocaleString()} ₸</span>
          </div>
          <div className={styles.paymentMethod}>
            💳 {order.paymentMethod === 'cash' ? 'Наличные' : 'Карта'}
          </div>
        </div>
      </div>

      {order.notes && (
        <div className={styles.orderNotes}>
          <MessageSquare size={16} />
          <span>{order.notes}</span>
        </div>
      )}

      {!isCompleted && (
        <div className={styles.orderActions}>
          <button 
            className={styles.actionButton}
            onClick={() => onCallCustomer(order.customer.phone)}
          >
            <Phone size={16} />
            Позвонить
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={() => onOpenMaps(order.customer.address, order.customer.coordinates)}
          >
            <Navigation size={16} />
            Маршрут
          </button>

          {order.status === 'ready_for_pickup' && (
            <button 
              className={`${styles.actionButton} ${styles.primaryAction}`}
              onClick={() => onStatusUpdate(order.id, 'delivering')}
            >
              <Package size={16} />
              Получен
            </button>
          )}

          {order.status === 'delivering' && (
            <button 
              className={`${styles.actionButton} ${styles.primaryAction}`}
              onClick={() => onStatusUpdate(order.id, 'completed')}
            >
              <CheckCircle size={16} />
              Доставлен
            </button>
          )}
        </div>
      )}

      {isCompleted && order.rating && (
        <div className={styles.completedInfo}>
          <div className={styles.rating}>
            <Star className={styles.starIcon} />
            <span>Оценка: {order.rating}/5</span>
          </div>
          <div className={styles.completedTime}>
            Доставлен в {formatTime(order.completedAt)}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourierDashboard