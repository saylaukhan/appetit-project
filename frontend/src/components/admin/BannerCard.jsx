import React from 'react'
import { 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  BarChart3,
  Calendar,
  MapPin,
  MousePointer,
  TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import styles from './BannerCard.module.css'

const BannerCard = ({ 
  banner, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onTrackView,
  onTrackClick 
}) => {

  // Получение цвета позиции
  const getPositionColor = (position) => {
    const colors = {
      main: '#e74c3c',
      hero: '#9b59b6', 
      featured: '#3498db',
      category: '#f39c12',
      cart: '#27ae60',
      checkout: '#e67e22',
      popup: '#e74c3c',
      notification: '#34495e'
    }
    return colors[position] || '#6c757d'
  }

  // Получение иконки позиции
  const getPositionIcon = (position) => {
    const icons = {
      main: '🏠',
      hero: '⭐',
      featured: '👍',
      category: '📂',
      cart: '🛒',
      checkout: '💳',
      popup: '⚠️',
      notification: '🔔'
    }
    return icons[position] || '📍'
  }

  // Получение названия позиции
  const getPositionName = (position) => {
    const names = {
      main: 'Главная',
      hero: 'Героический',
      featured: 'Рекомендуемый',
      category: 'Категория',
      cart: 'Корзина',
      checkout: 'Оформление',
      popup: 'Модальное окно',
      notification: 'Уведомление'
    }
    return names[position] || position
  }

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  // Вычисление CTR
  const calculateCTR = () => {
    if (!banner.view_count || banner.view_count === 0) return 0
    return ((banner.click_count / banner.view_count) * 100).toFixed(1)
  }

  // Определение статуса по времени
  const getTimeStatus = () => {
    const now = new Date()
    const showFrom = banner.show_from ? new Date(banner.show_from) : null
    const showUntil = banner.show_until ? new Date(banner.show_until) : null

    if (showFrom && now < showFrom) {
      return { status: 'scheduled', text: 'Запланирован', color: '#f39c12' }
    }
    if (showUntil && now > showUntil) {
      return { status: 'expired', text: 'Истек', color: '#e74c3c' }
    }
    if (banner.is_active) {
      return { status: 'active', text: 'Активен', color: '#27ae60' }
    }
    return { status: 'inactive', text: 'Неактивен', color: '#6c757d' }
  }

  const timeStatus = getTimeStatus()

  const handleEdit = () => {
    onEdit(banner)
  }

  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить баннер "${banner.title}"?`)) {
      onDelete(banner.id)
    }
  }

  const handleToggleStatus = () => {
    onToggleStatus(banner.id, banner.is_active)
  }

  const handleViewClick = () => {
    if (onTrackView) {
      onTrackView(banner.id)
      toast.success('Просмотр засчитан')
    }
  }

  const handleLinkClick = () => {
    if (banner.link) {
      if (onTrackClick) {
        onTrackClick(banner.id)
      }
      if (banner.link.startsWith('http')) {
        window.open(banner.link, '_blank')
      } else {
        console.log('Переход по ссылке:', banner.link)
        toast.success(`Переход: ${banner.link}`)
      }
    }
  }

  return (
    <div className={`${styles.bannerCard} ${!banner.is_active ? styles.inactive : ''}`}>
      {/* Header with status */}
      <div className={styles.cardHeader}>
        <div 
          className={styles.position}
          style={{ backgroundColor: getPositionColor(banner.position) }}
        >
          <span className={styles.positionIcon}>{getPositionIcon(banner.position)}</span>
          <span className={styles.positionText}>{getPositionName(banner.position)}</span>
        </div>
        
        <div 
          className={styles.status}
          style={{ color: timeStatus.color }}
        >
          <div className={styles.statusDot} style={{ backgroundColor: timeStatus.color }} />
          {timeStatus.text}
        </div>
      </div>

      {/* Banner preview */}
      <div 
        className={styles.bannerPreview}
        style={{ backgroundColor: getPositionColor(banner.position) }}
        onClick={handleViewClick}
      >
        {banner.image ? (
          <div className={styles.bannerImage}>
            <img src={banner.image} alt={banner.title} />
          </div>
        ) : (
          <div className={styles.bannerPlaceholder}>
            <Eye size={24} />
            <span>Без изображения</span>
          </div>
        )}
        
        <div className={styles.bannerContent}>
          <h3 className={styles.bannerTitle}>{banner.title}</h3>
          {banner.description && (
            <p className={styles.bannerDescription}>{banner.description}</p>
          )}
          
          {banner.link && (
            <button 
              className={styles.linkButton}
              onClick={(e) => {
                e.stopPropagation()
                handleLinkClick()
              }}
            >
              <ExternalLink size={14} />
              Перейти
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <Eye size={14} />
          <span className={styles.statValue}>{banner.view_count || 0}</span>
          <span className={styles.statLabel}>Просмотры</span>
        </div>
        
        <div className={styles.stat}>
          <MousePointer size={14} />
          <span className={styles.statValue}>{banner.click_count || 0}</span>
          <span className={styles.statLabel}>Клики</span>
        </div>
        
        <div className={styles.stat}>
          <TrendingUp size={14} />
          <span className={styles.statValue}>{calculateCTR()}%</span>
          <span className={styles.statLabel}>CTR</span>
        </div>
      </div>

      {/* Details */}
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span>Порядок:</span>
          <span>#{banner.sort_order}</span>
        </div>
        
        {banner.show_from && (
          <div className={styles.detailRow}>
            <Calendar size={12} />
            <span>С {formatDate(banner.show_from)}</span>
          </div>
        )}
        
        {banner.show_until && (
          <div className={styles.detailRow}>
            <Calendar size={12} />
            <span>До {formatDate(banner.show_until)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button 
          className={styles.actionButton}
          onClick={handleEdit}
          title="Редактировать"
        >
          <Edit3 size={16} />
        </button>
        
        <button 
          className={`${styles.actionButton} ${banner.is_active ? styles.disableButton : styles.enableButton}`}
          onClick={handleToggleStatus}
          title={banner.is_active ? 'Деактивировать' : 'Активировать'}
        >
          {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        
        <button 
          className={`${styles.actionButton} ${styles.statsButton}`}
          onClick={() => window.open(`#/admin/marketing/banners/${banner.id}/stats`, '_blank')}
          title="Статистика"
        >
          <BarChart3 size={16} />
        </button>
        
        <button 
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={handleDelete}
          title="Удалить"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default BannerCard