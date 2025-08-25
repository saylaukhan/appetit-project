import React, { useEffect, useState } from 'react'
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChefHat
} from 'lucide-react'
import { adminAPI } from '../../services/api'
import { useNotifications } from '../../hooks/useNotifications'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import NotificationBadge from '../../components/common/NotificationBadge'
import styles from './Dashboard.module.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])
  const { notifications } = useNotifications()

  useEffect(() => {
    fetchDashboardData()
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Получаем реальные данные из API
      const response = await adminAPI.getDashboard()
      const data = response.data
      
      // Устанавливаем статистические данные
      setStats({
        totalOrders: data.statistics.total_orders,
        totalRevenue: data.statistics.total_revenue,
        activeUsers: data.statistics.active_users,
        averageOrderValue: data.statistics.average_check
      })
      
      // Формируем данные последних заказов
      const formattedOrders = data.recent_orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        customer: order.customer_name,
        total: order.total_amount,
        status: getStatusFromRussian(order.status),
        time: order.time_ago
      }))
      
      setRecentOrders(formattedOrders)
      setLoading(false)
      
    } catch (error) {
      console.error('Ошибка загрузки данных панели:', error)
      // В случае ошибки показываем моковые данные
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        activeUsers: 0,
        averageOrderValue: 0
      })
      setRecentOrders([])
      setLoading(false)
    }
  }
  
  const getStatusFromRussian = (russianStatus) => {
    const statusMap = {
      'Ожидает подтверждения': 'pending',
      'Подтвержден': 'confirmed',
      'Готовится': 'preparing',
      'В процессе': 'cooking',
      'Готов': 'ready',
      'Доставляется': 'delivering',
      'Доставлен': 'delivered',
      'Отменен': 'cancelled'
    }
    return statusMap[russianStatus] || 'pending'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className={styles.statusIcon} />
      case 'confirmed': return <CheckCircle className={styles.statusIcon} />
      case 'preparing': return <AlertCircle className={styles.statusIcon} />
      case 'cooking': return <AlertCircle className={styles.statusIcon} />
      case 'ready': return <CheckCircle className={styles.statusIcon} />
      case 'delivering': return <TrendingUp className={styles.statusIcon} />
      case 'delivered': return <CheckCircle className={styles.statusIcon} />
      case 'cancelled': return <AlertCircle className={styles.statusIcon} />
      default: return <Clock className={styles.statusIcon} />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает'
      case 'confirmed': return 'Подтвержден'
      case 'preparing': return 'Готовится'
      case 'cooking': return 'В процессе'
      case 'ready': return 'Готов'
      case 'delivering': return 'Доставляется'
      case 'delivered': return 'Доставлен'
      case 'cancelled': return 'Отменен'
      default: return status
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending
      case 'confirmed': return styles.statusConfirmed
      case 'preparing': return styles.statusPreparing
      case 'cooking': return styles.statusCooking
      case 'ready': return styles.statusReady
      case 'delivering': return styles.statusDelivering
      case 'delivered': return styles.statusDelivered
      case 'cancelled': return styles.statusCancelled
      default: return styles.statusPending
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1>Панель управления APPETIT</h1>
        <p>Добро пожаловать в административную панель!</p>
      </div>

      {/* Статистические карточки */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <ShoppingBag />
          </div>
          <div className={styles.statContent}>
            <h3>Всего заказов</h3>
            <p className={styles.statNumber}>{stats.totalOrders.toLocaleString()}</p>
            <span className={styles.statGrowth}>всего заказов в системе</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign />
          </div>
          <div className={styles.statContent}>
            <h3>Общая выручка</h3>
            <p className={styles.statNumber}>{stats.totalRevenue.toLocaleString()} ₸</p>
            <span className={styles.statGrowth}>от доставленных заказов</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users />
          </div>
          <div className={styles.statContent}>
            <h3>Активные пользователи</h3>
            <p className={styles.statNumber}>{stats.activeUsers.toLocaleString()}</p>
            <span className={styles.statGrowth}>зарегистрированных клиентов</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <BarChart3 />
          </div>
          <div className={styles.statContent}>
            <h3>Средний чек</h3>
            <p className={styles.statNumber}>{stats.averageOrderValue.toLocaleString()} ₸</p>
            <span className={styles.statGrowth}>средняя стоимость заказа</span>
          </div>
        </div>
      </div>

      {/* Последние заказы */}
      <div className={styles.recentOrders}>
        <div className={styles.sectionHeader}>
          <h2>Последние заказы</h2>
          <button 
            className={styles.viewAllButton}
            onClick={() => window.location.href = '/admin/orders'}
          >
            Посмотреть все
          </button>
        </div>
        
        <div className={styles.ordersTable}>
          <div className={styles.tableHeader}>
            <span>Заказ</span>
            <span>Клиент</span>
            <span>Сумма</span>
            <span>Статус</span>
            <span>Время</span>
          </div>
          
          {recentOrders.map(order => (
            <div key={order.id} className={styles.tableRow}>
              <span className={styles.orderId}>#{order.orderNumber || order.id.toString().padStart(4, '0')}</span>
              <span className={styles.customerName}>{order.customer}</span>
              <span className={styles.orderTotal}>{order.total.toLocaleString()} ₸</span>
              <span className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                {getStatusIcon(order.status)}
                {getStatusText(order.status)}
              </span>
              <span className={styles.orderTime}>{order.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Быстрые действия */}
      <div className={styles.quickActions}>
        <h2>Быстрые действия</h2>
        <div className={styles.actionsGrid}>
          <button 
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/orders'}
          >
            <NotificationBadge count={notifications.pending_orders}>
              <ShoppingBag />
            </NotificationBadge>
            <span>Заказы</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/menu'}
          >
            <ChefHat />
            <span>Меню</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/users'}
          >
            <Users />
            <span>Пользователи</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/analytics'}
          >
            <TrendingUp />
            <span>Аналитика</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard