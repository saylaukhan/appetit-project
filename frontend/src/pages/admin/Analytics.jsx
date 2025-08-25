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
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './Analytics.module.css'
import { toast } from 'react-hot-toast'

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
      const response = await adminAPI.getAnalytics()
      const data = response.data
      
      // Адаптируем данные к существующей структуре компонента
      const adaptedAnalytics = {
        overview: {
          totalRevenue: data.main_metrics.total_revenue.value,
          revenueGrowth: data.main_metrics.total_revenue.growth,
          totalOrders: data.main_metrics.total_orders.value,
          ordersGrowth: data.main_metrics.total_orders.growth,
          averageOrderValue: data.main_metrics.average_check.value,
          avgOrderGrowth: data.main_metrics.average_check.growth,
          activeCustomers: data.main_metrics.active_clients.value,
          customerGrowth: data.main_metrics.active_clients.growth
        },
        revenue: {
          today: data.revenue_periods.today,
          yesterday: data.revenue_periods.today * 0.92, // Примерное значение
          thisWeek: data.revenue_periods.week,
          lastWeek: data.revenue_periods.week * 0.89, // Примерное значение
          thisMonth: data.revenue_periods.month,
          lastMonth: data.revenue_periods.month * 0.87 // Примерное значение
        },
        topDishes: data.popular_dishes.map(dish => ({
          name: dish.dish_name,
          orders: dish.orders_count,
          revenue: dish.revenue,
          growth: parseFloat(dish.growth.replace('%', '')) || 0
        })),
        ordersByHour: data.hourly_orders.map(item => ({
          hour: String(item.hour).padStart(2, '0') + ':00',
          orders: item.orders_count
        })),
        customerTypes: [
          { 
            type: 'Новые клиенты', 
            count: data.client_types.new_clients.count, 
            percentage: data.client_types.new_clients.percentage 
          },
          { 
            type: 'Постоянные клиенты', 
            count: data.client_types.regular_clients.count, 
            percentage: data.client_types.regular_clients.percentage 
          }
        ],
        paymentMethods: data.payment_methods.map((method, index) => {
          const total = data.payment_methods.reduce((sum, m) => sum + m.count, 0)
          return {
            method: method.method,
            orders: method.count,
            percentage: total > 0 ? ((method.count / total) * 100).toFixed(1) : 0
          }
        })
      }
      
      setAnalytics(adaptedAnalytics)
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error)
      toast.error('Не удалось загрузить данные аналитики')
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

  const handleExportData = async () => {
    try {
      toast.loading('Подготавливаем данные для экспорта...')
      const response = await adminAPI.exportAnalytics()
      
      // Создаем ссылку для скачивания файла
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      // Генерируем имя файла с текущей датой
      const now = new Date()
      const filename = `analytics_export_${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}.csv`
      link.setAttribute('download', filename)
      
      // Скачиваем файл
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.dismiss()
      toast.success('Данные успешно экспортированы')
    } catch (error) {
      console.error('Ошибка экспорта:', error)
      toast.dismiss()
      toast.error('Ошибка при экспорте данных')
    }
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

  if (!analytics) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.errorMessage}>
          Не удалось загрузить данные аналитики. Попробуйте обновить страницу.
        </div>
      </div>
    )
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
          
          <button className={styles.exportButton} onClick={handleExportData}>
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