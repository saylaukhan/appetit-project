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
  ShoppingBag,
  User,
  X
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import OrderDetailsModal from '../../components/common/OrderDetailsModal'
import { toast } from 'react-hot-toast'
import styles from './OrderManagement.module.css'

function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [showCourierModal, setShowCourierModal] = useState(false)
  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState(null)

  useEffect(() => {
    fetchOrders()
    fetchCouriers()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllOrders()
      setOrders(response.data)
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
      toast.error('Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }

  const fetchCouriers = async () => {
    try {
      const response = await adminAPI.getCouriers()
      setCouriers(response.data)
    } catch (error) {
      console.error('Ошибка загрузки курьеров:', error)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus)
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      
      toast.success('Статус заказа обновлен')
    } catch (error) {
      console.error('Ошибка обновления статуса заказа:', error)
      toast.error('Ошибка обновления статуса заказа')
    }
  }

  const assignCourier = async (orderId, courierId) => {
    try {
      await adminAPI.assignCourier(orderId, courierId)
      
      // Обновляем заказ в списке
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'delivering', assigned_courier_id: courierId } : order
      ))
      
      toast.success('Курьер назначен на заказ')
      setShowCourierModal(false)
      setSelectedOrderForCourier(null)
    } catch (error) {
      console.error('Ошибка назначения курьера:', error)
      toast.error('Ошибка назначения курьера')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className={styles.statusIcon} />
      case 'confirmed': return <CheckCircle className={styles.statusIcon} />
      case 'preparing': return <AlertCircle className={styles.statusIcon} />
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
      case 'confirmed': return 'Подтвержден'
      case 'preparing': return 'Готовится'
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
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.includes(searchTerm)
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
            <option value="confirmed">Подтвержден</option>
            <option value="preparing">Готовится</option>
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
                <span><MapPin size={14} /> {order.delivery_address || 'Самовывоз'}</span>
              </div>
            </div>

            <div className={styles.orderItems}>
              {order.items && order.items.map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <span>{item.dish_name} x{item.quantity}</span>
                  <span>{item.total_price.toLocaleString()} ₸</span>
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
                  <Eye size={16} />
                  Подробнее
                </button>
                
                {order.status === 'pending' && (
                  <button 
                    className={`${styles.actionButton} ${styles.confirmButton}`}
                    onClick={() => updateOrderStatus(order.id, 'confirmed')}
                  >
                    <CheckCircle size={16} />
                    Подтвердить
                  </button>
                )}
                
                {order.status === 'ready' && order.delivery_type === 'delivery' && (
                  <button 
                    className={`${styles.actionButton} ${styles.deliverButton}`}
                    onClick={() => {
                      setSelectedOrderForCourier(order)
                      setShowCourierModal(true)
                    }}
                  >
                    <User size={16} />
                    Назначить курьера
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

      {/* Модальное окно деталей заказа */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      )}

      {/* Модальное окно назначения курьера */}
      {showCourierModal && selectedOrderForCourier && (
        <div className={styles.modalOverlay} onClick={() => setShowCourierModal(false)}>
          <div className={styles.courierModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Назначить курьера</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCourierModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Заказ #{selectedOrderForCourier.order_number}</p>
              <p>Адрес: {selectedOrderForCourier.delivery_address}</p>
              
              <div className={styles.couriersGrid}>
                {couriers.map(courier => (
                  <button
                    key={courier.id}
                    className={styles.courierCard}
                    onClick={() => assignCourier(selectedOrderForCourier.id, courier.id)}
                  >
                    <User size={24} />
                    <span>{courier.name}</span>
                    <span className={styles.courierPhone}>{courier.phone}</span>
                  </button>
                ))}
              </div>
              
              {couriers.length === 0 && (
                <p className={styles.noCouriers}>Нет доступных курьеров</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement