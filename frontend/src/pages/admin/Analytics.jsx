import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Filter,
  Download
} from 'lucide-react'
import { analyticsAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './Analytics.module.css'

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [chartData, setChartData] = useState({
    revenue: [],
    orders: [],
    topDishes: [],
    customerStats: []
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // В реальном приложении здесь будет API вызов
      // const response = await analyticsAPI.getAnalytics(timeRange)
      
      // Пока используем моковые данные
      setTimeout(() => {
        const mockAnalytics = {
          overview: {
            totalRevenue: 2456780,
            revenueGrowth: 12.5,
            totalOrders: 1247,
            ordersGrowth: 8.3,
            averageOrderValue: 1968,
            avgOrderGrowth: 5.2,
            activeCustomers: 8923,
            customerGrowth: 15.7
          },
          revenue: {
            today: 45670,
            yesterday: 42100,
            thisWeek: 298540,
            lastWeek: 267200,
            thisMonth: 1123400,
            lastMonth: 1001200
          },
          topDishes: [
            { name: 'Пицца Маргарита', orders: 156, revenue: 390000, growth: 12 },
            { name: 'Бургер Классик', orders: 134, revenue: 294800, growth: 8 },
            { name: 'Ролл Филадельфия', orders: 89, revenue: 160200, growth: -2 },
            { name: 'Салат Цезарь', orders: 67, revenue: 100500, growth: 15 },
            { name: 'Борщ украинский', orders: 45, revenue: 45000, growth: 5 }
          ],
          ordersByHour: [
            { hour: '00:00', orders: 2 },
            { hour: '01:00', orders: 1 },
            { hour: '02:00', orders: 0 },
            { hour: '03:00', orders: 1 },
            { hour: '04:00', orders: 0 },
            { hour: '05:00', orders: 3 },
            { hour: '06:00', orders: 8 },
            { hour: '07:00', orders: 15 },
            { hour: '08:00', orders: 25 },
            { hour: '09:00', orders: 35 },
            { hour: '10:00', orders: 42 },
            { hour: '11:00', orders: 58 },
            { hour: '12:00', orders: 72 },
            { hour: '13:00', orders: 68 },
            { hour: '14:00', orders: 55 },
            { hour: '15:00', orders: 48 },
            { hour: '16:00', orders: 52 },
            { hour: '17:00', orders: 65 },
            { hour: '18:00', orders: 78 },
            { hour: '19:00', orders: 85 },
            { hour: '20:00', orders: 82 },
            { hour: '21:00', orders: 75 },
            { hour: '22:00', orders: 45 },
            { hour: '23:00', orders: 25 }
          ],
          customerTypes: [
            { type: 'Новые клиенты', count: 2341, percentage: 32 },
            { type: 'Постоянные клиенты', count: 4875, percentage: 68 }
          ],
          paymentMethods: [
            { method: 'Карта онлайн', orders: 856, percentage: 68.6 },
            { method: 'Наличные', orders: 391, percentage: 31.4 }
          ]
        }
        
        setAnalytics(mockAnalytics)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error)
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const renderGrowthIndicator = (growth) => {
    const isPositive = growth > 0
    const Icon = isPositive ? ArrowUp : ArrowDown
    const colorClass = isPositive ? styles.positive : styles.negative
    
    return (
      <span className={`${styles.growth} ${colorClass}`}>
        <Icon size={14} />
        {Math.abs(growth)}%
      </span>
    )
  }

  const getTimeRangeText = (range) => {
    switch (range) {
      case '24h': return 'За 24 часа'
      case '7d': return 'За 7 дней'
      case '30d': return 'За 30 дней'
      case '90d': return 'За 3 месяца'
      default: return 'За 7 дней'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Аналитика и отчеты</h1>
          <p>Детальная статистика по продажам и клиентам</p>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.timeRangeSelector}>
            <Filter size={16} />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className={styles.timeRangeSelect}
            >
              <option value="24h">24 часа</option>
              <option value="7d">7 дней</option>
              <option value="30d">30 дней</option>
              <option value="90d">3 месяца</option>
            </select>
          </div>
          
          <button className={styles.exportButton}>
            <Download size={16} />
            Экспорт
          </button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <DollarSign />
          </div>
          <div className={styles.metricContent}>
            <h3>Общая выручка</h3>
            <div className={styles.metricValue}>
              {formatCurrency(analytics.overview.totalRevenue)}
            </div>
            {renderGrowthIndicator(analytics.overview.revenueGrowth)}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <ShoppingBag />
          </div>
          <div className={styles.metricContent}>
            <h3>Всего заказов</h3>
            <div className={styles.metricValue}>
              {analytics.overview.totalOrders.toLocaleString()}
            </div>
            {renderGrowthIndicator(analytics.overview.ordersGrowth)}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <BarChart3 />
          </div>
          <div className={styles.metricContent}>
            <h3>Средний чек</h3>
            <div className={styles.metricValue}>
              {formatCurrency(analytics.overview.averageOrderValue)}
            </div>
            {renderGrowthIndicator(analytics.overview.avgOrderGrowth)}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Users />
          </div>
          <div className={styles.metricContent}>
            <h3>Активные клиенты</h3>
            <div className={styles.metricValue}>
              {analytics.overview.activeCustomers.toLocaleString()}
            </div>
            {renderGrowthIndicator(analytics.overview.customerGrowth)}
          </div>
        </div>
      </div>

      {/* Выручка по периодам */}
      <div className={styles.revenueSection}>
        <h2>Выручка {getTimeRangeText(timeRange)}</h2>
        <div className={styles.revenueGrid}>
          <div className={styles.revenueCard}>
            <h4>Сегодня</h4>
            <div className={styles.revenueAmount}>
              {formatCurrency(analytics.revenue.today)}
            </div>
            <div className={styles.revenueComparison}>
              Вчера: {formatCurrency(analytics.revenue.yesterday)}
            </div>
          </div>
          
          <div className={styles.revenueCard}>
            <h4>Эта неделя</h4>
            <div className={styles.revenueAmount}>
              {formatCurrency(analytics.revenue.thisWeek)}
            </div>
            <div className={styles.revenueComparison}>
              Прошлая: {formatCurrency(analytics.revenue.lastWeek)}
            </div>
          </div>
          
          <div className={styles.revenueCard}>
            <h4>Этот месяц</h4>
            <div className={styles.revenueAmount}>
              {formatCurrency(analytics.revenue.thisMonth)}
            </div>
            <div className={styles.revenueComparison}>
              Прошлый: {formatCurrency(analytics.revenue.lastMonth)}
            </div>
          </div>
        </div>
      </div>

      {/* Топ блюда и заказы по часам */}
      <div className={styles.chartsSection}>
        <div className={styles.topDishes}>
          <h2>Популярные блюда</h2>
          <div className={styles.dishesTable}>
            <div className={styles.tableHeader}>
              <span>Блюдо</span>
              <span>Заказов</span>
              <span>Выручка</span>
              <span>Рост</span>
            </div>
            {analytics.topDishes.map((dish, index) => (
              <div key={index} className={styles.tableRow}>
                <span className={styles.dishName}>{dish.name}</span>
                <span className={styles.dishOrders}>{dish.orders}</span>
                <span className={styles.dishRevenue}>
                  {formatCurrency(dish.revenue)}
                </span>
                <span>
                  {renderGrowthIndicator(dish.growth)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.hourlyChart}>
          <h2>Заказы по часам</h2>
          <div className={styles.chartContainer}>
            <div className={styles.chartBars}>
              {analytics.ordersByHour.map((item, index) => {
                const maxOrders = Math.max(...analytics.ordersByHour.map(h => h.orders))
                const height = (item.orders / maxOrders) * 100
                
                return (
                  <div key={index} className={styles.chartBar}>
                    <div 
                      className={styles.bar}
                      style={{ height: `${height}%` }}
                      title={`${item.hour}: ${item.orders} заказов`}
                    />
                    <span className={styles.barLabel}>{item.hour.slice(0, 2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Клиенты и способы оплаты */}
      <div className={styles.statsSection}>
        <div className={styles.customerStats}>
          <h2>Типы клиентов</h2>
          <div className={styles.pieChart}>
            {analytics.customerTypes.map((type, index) => (
              <div key={index} className={styles.pieItem}>
                <div 
                  className={styles.pieColor}
                  style={{ 
                    backgroundColor: index === 0 ? 'var(--primary-color)' : 'var(--accent-color)' 
                  }}
                />
                <div className={styles.pieLabel}>
                  <div>{type.type}</div>
                  <div className={styles.pieValue}>
                    {type.count.toLocaleString()} ({type.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.paymentStats}>
          <h2>Способы оплаты</h2>
          <div className={styles.pieChart}>
            {analytics.paymentMethods.map((method, index) => (
              <div key={index} className={styles.pieItem}>
                <div 
                  className={styles.pieColor}
                  style={{ 
                    backgroundColor: index === 0 ? 'var(--success)' : 'var(--warning)' 
                  }}
                />
                <div className={styles.pieLabel}>
                  <div>{method.method}</div>
                  <div className={styles.pieValue}>
                    {method.orders} ({method.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics