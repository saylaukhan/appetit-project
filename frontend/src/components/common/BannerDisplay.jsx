import React, { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { marketingAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import styles from './BannerDisplay.module.css'

const BannerDisplay = ({ position = 'main', className = '', maxCount = null }) => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [closedBanners, setClosedBanners] = useState(new Set())

  useEffect(() => {
    fetchBanners()
  }, [position])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      let response
      
      if (position === 'main' || position === 'featured') {
        response = await marketingAPI.getMainBanners()
      } else {
        response = await marketingAPI.getBannersByPosition(position)
      }
      
      let fetchedBanners = response.data || []
      
      // Ограничиваем количество баннеров если задано
      if (maxCount && fetchedBanners.length > maxCount) {
        fetchedBanners = fetchedBanners.slice(0, maxCount)
      }
      
      setBanners(fetchedBanners)
      
      // Отслеживаем просмотры баннеров
      fetchedBanners.forEach(banner => {
        marketingAPI.trackBannerView(banner.id).catch(console.error)
      })
      
    } catch (error) {
      console.error('Ошибка загрузки баннеров:', error)
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  const handleBannerClick = async (banner) => {
    try {
      // Отслеживаем клик
      await marketingAPI.trackBannerClick(banner.id)
      
      // Переходим по ссылке если она есть
      if (banner.link) {
        if (banner.link.startsWith('http')) {
          window.open(banner.link, '_blank')
        } else {
          // Для внутренних ссылок можно использовать React Router
          window.location.href = banner.link
        }
      }
    } catch (error) {
      console.error('Ошибка отслеживания клика:', error)
    }
  }

  const handleCloseBanner = (bannerId) => {
    setClosedBanners(prev => new Set([...prev, bannerId]))
  }

  const getPositionStyle = (position) => {
    const styles = {
      main: { backgroundColor: '#e74c3c' },
      hero: { backgroundColor: '#e74c3c' },
      featured: { backgroundColor: '#3498db' },
      category: { backgroundColor: '#f39c12' },
      cart: { backgroundColor: '#27ae60' },
      checkout: { backgroundColor: '#e67e22' },
      popup: { backgroundColor: '#e74c3c' },
      notification: { backgroundColor: '#e74c3c' }
    }
    return styles[position] || { backgroundColor: '#e74c3c' }
  }

  const getPositionColor = (position) => {
    const colors = {
      main: '#e74c3c',
      hero: '#e74c3c',
      featured: '#3498db',
      category: '#f39c12',
      cart: '#27ae60',
      checkout: '#e67e22',
      popup: '#e74c3c',
      notification: '#e74c3c'
    }
    return colors[position] || '#e74c3c'
  }

  const getBannerColors = () => {
    const colorPalette = [
      '#86c558', // зеленый
      '#e74c3c', // красный
      '#9b59b6', // фиолетовый
      '#f39c12', // оранжевый
      '#8b4513', // коричневый
      '#3498db', // голубой
      '#27ae60', // зеленый
      '#e67e22', // темно-оранжевый
    ]
    return colorPalette
  }

  // Фильтруем закрытые баннеры
  const visibleBanners = banners.filter(banner => !closedBanners.has(banner.id))

  if (loading || visibleBanners.length === 0) {
    return null
  }

  // Для popup баннеров показываем модальные окна
  if (position === 'popup') {
    return (
      <>
        {visibleBanners.map(banner => (
          <div key={banner.id} className={styles.popupOverlay}>
            <div 
              className={styles.popupBanner}
              style={getPositionStyle(banner.position)}
            >
              <button 
                className={styles.closeButton}
                onClick={() => handleCloseBanner(banner.id)}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
              
              <div className={styles.popupContent}>
                {banner.image && (
                  <div className={styles.popupImage}>
                    <img src={banner.image} alt={banner.title} />
                  </div>
                )}
                
                <div className={styles.popupText}>
                  <h3 className={styles.popupTitle}>{banner.title}</h3>
                  {banner.description && (
                    <p className={styles.popupDescription}>{banner.description}</p>
                  )}
                  
                  {banner.link && (
                    <button 
                      className={styles.popupButton}
                      onClick={() => handleBannerClick(banner)}
                    >
                      <ExternalLink size={16} />
                      Подробнее
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  // Показываем все баннеры как сетку карточек-сторисов в стиле APPETIT
  const colorPalette = getBannerColors()
  
  return (
    <div className={`${styles.bannersContainer} ${className}`}>
      <div className={styles.bannersGrid}>
        {visibleBanners.map((banner, index) => {
          const cardColor = colorPalette[index % colorPalette.length]
          
          return (
            <div 
              key={banner.id}
              className={styles.bannerCard}
              style={{ backgroundColor: cardColor }}
              onClick={() => handleBannerClick(banner)}
            >
              {banner.image ? (
                <div className={styles.bannerImageContainer}>
                  <img src={banner.image} alt={banner.title} className={styles.bannerImage} />
                </div>
              ) : (
                <div className={styles.bannerIcon}>
                  {getBannerIcon(banner.position)}
                </div>
              )}
              
              <div className={styles.bannerCardContent}>
                <h3 className={styles.bannerCardTitle}>{banner.title}</h3>
                {banner.description && (
                  <p className={styles.bannerCardDescription}>{banner.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Вспомогательная функция для получения иконок
const getBannerIcon = (position) => {
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

export default BannerDisplay