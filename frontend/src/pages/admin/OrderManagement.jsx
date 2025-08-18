import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck,
  Phone,
  MapPin,
  ShoppingBag
} from 'lucide-react'
import { ordersAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './OrderManagement.module.css'

function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      // В реальном приложении здесь будет API вызов
      // const response = await ordersAPI.getOrders({ status: statusFilter })
      
      // Пока используем моковые данные
      setTimeout(() => {
        const mockOrders = [
          {
            id: 1,
            orderNumber: '0001',
            customer: {
              name: 'Айгуль Казыбекова',
              phone: '+77774567890',
              address: 'ул. Абая 150, кв. 25'
            },
            items: [
              { name: 'Пицца Маргарита', quantity: 1, price: 2500 },
              { name: 'Кока-Кола 0.5л', quantity: 2, price: 600 }
            ],
            total: 3700,
            status: 'pending',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            deliveryType: 'delivery',
            paymentMethod: 'card',
            notes: 'Без лука, пожалуйста'
          },
          {
            id: 2,
            orderNumber: '0002',
            customer: {
              name: 'Арман Токтасынов',
              phone: '+77773456789',
              address: 'ул. Сатпаева 90, офис 15'
            },
            items: [
              { name: 'Бургер Классик', quantity: 2, price: 4400 },
              { name: 'Картофель фри', quantity: 1, price: 800 }
            ],
            total: 5200,
            status: 'cooking',
            createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            deliveryType: 'delivery',
            paymentMethod: 'cash',
            courier: 'Курьер Арман'
          },
          {
            id: 3,
            orderNumber: '0003',
            customer: {
              name: 'Жанар Сапарова',
              phone: '+77785678901',
              address: 'Самовывоз'
            },
            items: [
              { name: 'Ролл Филадельфия', quantity: 3, price: 5400 },
              { name: 'Зеленый чай', quantity: 1, price: 200 }
            ],
            total: 5600,
            status: 'ready',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            deliveryType: 'pickup',
            paymentMethod: 'card'
          },
          {
            id: 4,
            orderNumber: '0004',
            customer: {
              name: 'Даулет Мусабаев',
              phone: '+77796789012',
              address: 'пр. Назарбаева 220, дом 15'
            },
            items: [
              { name: 'Салат Цезарь', quantity: 1, price: 1500 },
              { name: 'Борщ украинский', quantity: 1, price: 1000 }
            ],
            total: 2500,
            status: 'delivered',
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            deliveryType: 'delivery',
            paymentMethod: 'card',
            courier: 'Курьер Бекзат'
          }
        ]
        
        setOrders(mockOrders)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // В реальном приложении здесь будет API вызов
      // await ordersAPI.updateOrderStatus(orderId, newStatus)
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error) {
      console.error('Ошибка обновления статуса заказа:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className={styles.statusIcon} />
      case 'preparing': return <AlertCircle className={styles.statusIcon} />
      case 'cooking': return <AlertCircle className={styles.statusIcon} />
      case 'ready': return <CheckCircle className={styles.statusIcon} />
      case 'delivering': return <Truck className={styles.statusIcon} />
      case 'delivered': return <CheckCircle className={styles.statusIcon} />
      case 'cancelled': return <AlertCircle className={styles.statusIcon} />
      default: return <Clock className={styles.statusIcon} />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает подтверждения'
      case 'preparing': return 'Подготовка'
      case 'cooking': return 'Готовится'
      case 'ready': return 'Готов'
      case 'delivering': return 'Доставляется'
      case 'delivered': return 'Доставлен'
      case 'cancelled': return 'Отменен'
      default: return status
    }
  }

  const getStatusClass = (status) => {
    return styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`] || styles.statusPending
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.orderManagement}>
      <div className={styles.header}>
        <h1>Управление заказами</h1>
        <p>Просматривайте и управляйте всеми заказами ресторана</p>
      </div>

      {/* Фильтры и поиск */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по имени клиента или номеру заказа..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.statusFilter}>
          <Filter className={styles.filterIcon} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="cooking">Готовится</option>
            <option value="ready">Готов</option>
            <option value="delivering">Доставляется</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>
        </div>
      </div>

      {/* Список заказов */}
      <div className={styles.ordersGrid}>
        {filteredOrders.map(order => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div className={styles.orderInfo}>
                <span className={styles.orderNumber}>#{order.orderNumber}</span>
                <span className={styles.orderTime}>{formatTime(order.createdAt)}</span>
              </div>
              <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                {getStatusIcon(order.status)}
                {getStatusText(order.status)}
              </div>
            </div>

            <div className={styles.customerInfo}>
              <h3>{order.customer.name}</h3>
              <div className={styles.customerDetails}>
                <span><Phone size={14} /> {order.customer.phone}</span>
                <span><MapPin size={14} /> {order.customer.address}</span>
              </div>
            </div>

            <div className={styles.orderItems}>
              {order.items.map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <span>{item.name} x{item.quantity}</span>
                  <span>{item.price.toLocaleString()} ₸</span>
                </div>
              ))}
            </div>

            <div className={styles.orderFooter}>
              <div className={styles.orderTotal}>
                <strong>Итого: {order.total.toLocaleString()} ₸</strong>
              </div>
              
              <div className={styles.orderActions}>
                <button 
                  className={styles.actionButton}
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye size={16} />
                  Подробнее
                </button>
                
                {order.status === 'pending' && (
                  <button 
                    className={`${styles.actionButton} ${styles.confirmButton}`}
                    onClick={() => updateOrderStatus(order.id, 'cooking')}
                  >
                    <CheckCircle size={16} />
                    Подтвердить
                  </button>
                )}
                
                {order.status === 'ready' && order.deliveryType === 'delivery' && (
                  <button 
                    className={`${styles.actionButton} ${styles.deliverButton}`}
                    onClick={() => updateOrderStatus(order.id, 'delivering')}
                  >
                    <Truck size={16} />
                    К доставке
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <ShoppingBag size={48} />
          <h3>Заказов не найдено</h3>
          <p>Попробуйте изменить критерии поиска или фильтры</p>
        </div>
      )}
    </div>
  )
}

export default OrderManagement