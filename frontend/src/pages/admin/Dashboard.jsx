import React, { useEffect, useState } from 'react'
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { analyticsAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './Dashboard.module.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // В реальном приложении здесь будут API вызовы
      // const response = await analyticsAPI.getDashboard()
      
      // Пока используем моковые данные
      setTimeout(() => {
        setStats({
          totalOrders: 1247,
          totalRevenue: 2456780,
          activeUsers: 8923,
          averageOrderValue: 1968
        })
        
        setRecentOrders([
          { id: 1, customer: 'Айгуль К.', total: 3200, status: 'preparing', time: '10 мин назад' },
          { id: 2, customer: 'Арман Т.', total: 1800, status: 'delivered', time: '25 мин назад' },
          { id: 3, customer: 'Жанар С.', total: 4500, status: 'cooking', time: '32 мин назад' },
          { id: 4, customer: 'Даулет М.', total: 2100, status: 'pending', time: '45 мин назад' },
          { id: 5, customer: 'Алия Н.', total: 3800, status: 'delivering', time: '1 ч назад' },
        ])
        
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error)
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className={styles.statusIcon} />
      case 'preparing': return <AlertCircle className={styles.statusIcon} />
      case 'cooking': return <AlertCircle className={styles.statusIcon} />
      case 'delivering': return <TrendingUp className={styles.statusIcon} />
      case 'delivered': return <CheckCircle className={styles.statusIcon} />
      default: return <Clock className={styles.statusIcon} />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает'
      case 'preparing': return 'Готовится'
      case 'cooking': return 'В процессе'
      case 'delivering': return 'Доставляется'
      case 'delivered': return 'Доставлен'
      default: return status
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending
      case 'preparing': return styles.statusPreparing
      case 'cooking': return styles.statusCooking
      case 'delivering': return styles.statusDelivering
      case 'delivered': return styles.statusDelivered
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
            <span className={styles.statGrowth}>+12% от прошлого месяца</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign />
          </div>
          <div className={styles.statContent}>
            <h3>Общая выручка</h3>
            <p className={styles.statNumber}>{stats.totalRevenue.toLocaleString()} ₸</p>
            <span className={styles.statGrowth}>+8% от прошлого месяца</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Users />
          </div>
          <div className={styles.statContent}>
            <h3>Активные пользователи</h3>
            <p className={styles.statNumber}>{stats.activeUsers.toLocaleString()}</p>
            <span className={styles.statGrowth}>+15% от прошлого месяца</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <BarChart3 />
          </div>
          <div className={styles.statContent}>
            <h3>Средний чек</h3>
            <p className={styles.statNumber}>{stats.averageOrderValue.toLocaleString()} ₸</p>
            <span className={styles.statGrowth}>+5% от прошлого месяца</span>
          </div>
        </div>
      </div>

      {/* Последние заказы */}
      <div className={styles.recentOrders}>
        <div className={styles.sectionHeader}>
          <h2>Последние заказы</h2>
          <button className={styles.viewAllButton}>Посмотреть все</button>
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
              <span className={styles.orderId}>#{order.id.toString().padStart(4, '0')}</span>
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
          <button className={styles.actionButton}>
            <ShoppingBag />
            <span>Новый заказ</span>
          </button>
          <button className={styles.actionButton}>
            <Users />
            <span>Добавить пользователя</span>
          </button>
          <button className={styles.actionButton}>
            <BarChart3 />
            <span>Посмотреть отчеты</span>
          </button>
          <button className={styles.actionButton}>
            <DollarSign />
            <span>Промокоды</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard