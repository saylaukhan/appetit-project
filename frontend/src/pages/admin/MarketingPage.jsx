import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag,
  Gift,
  Copy,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Image as ImageIcon,
  Eye,
  MousePointer,
  TrendingUp,
  PlayCircle
} from 'lucide-react'
import { promoAPI, marketingAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import PromoCodeModal from '../../components/admin/PromoCodeModal'
import BannerModal from '../../components/admin/BannerModal'
import StoryModal from '../../components/admin/StoryModal'
import BannerCard from '../../components/admin/BannerCard'
import styles from './MarketingPage.module.css'

function MarketingPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState('banners')
  
  // Promo codes state
  const [promoCodes, setPromoCodes] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  
  // Banners state
  const [banners, setBanners] = useState([])
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [marketingStats, setMarketingStats] = useState({})
  
  // Stories state
  const [stories, setStories] = useState([])
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [editingStory, setEditingStory] = useState(null)
  
  // Common state
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (activeTab === 'banners') {
      fetchBanners()
      fetchMarketingStats()
    } else if (activeTab === 'stories') {
      fetchStories()
    } else {
      fetchPromoCodes()
    }
  }, [activeTab])

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      const response = await promoAPI.getPromos()
      setPromoCodes(response.data || [])
    } catch (error) {
      console.error('Ошибка загрузки промокодов:', error)
      toast.error('Ошибка загрузки промокодов')
      setPromoCodes([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await marketingAPI.getAllBanners()
      setBanners(response.data.banners || [])
    } catch (error) {
      console.error('Ошибка загрузки баннеров:', error)
      toast.error('Ошибка загрузки баннеров')
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMarketingStats = async () => {
    try {
      const response = await marketingAPI.getMarketingDashboard()
      setMarketingStats(response.data.statistics || {})
    } catch (error) {
      console.error('Ошибка загрузки статистики маркетинга:', error)
      setMarketingStats({})
    }
  }

  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки историй')
      }
      
      const data = await response.json()
      setStories(data.stories || [])
    } catch (error) {
      console.error('Ошибка загрузки историй:', error)
      // Пока устанавливаем заглушку
      setStories([
        {
          id: 1,
          title: 'Новинка Дапа Барбекю',
          cover_image: '/api/uploads/story1-cover.jpg',
          content_image: '/api/uploads/story1-content.jpg',
          view_count: 125,
          click_count: 23,
          is_active: true
        },
        {
          id: 2, 
          title: 'Осторожно, мошенники!',
          cover_image: '/api/uploads/story2-cover.jpg',
          content_image: '/api/uploads/story2-content.jpg',
          view_count: 89,
          click_count: 12,
          is_active: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const copyPromoCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Промокод скопирован!')
  }

  // Banner functions
  const handleBannerEdit = (banner) => {
    setEditingBanner(banner)
    setShowBannerModal(true)
  }

  const handleBannerDelete = async (bannerId) => {
    try {
      await marketingAPI.deleteBanner(bannerId)
      setBanners(prev => prev.filter(banner => banner.id !== bannerId))
      toast.success('Баннер удален')
    } catch (error) {
      toast.error('Ошибка при удалении баннера')
      console.error('Ошибка удаления баннера:', error)
    }
  }

  const handleBannerToggleStatus = async (bannerId, currentStatus) => {
    try {
      // Находим баннер и обновляем его статус
      const banner = banners.find(b => b.id === bannerId)
      if (banner) {
        const updatedBanner = { ...banner, is_active: !currentStatus }
        await marketingAPI.updateBanner(bannerId, updatedBanner)
        setBanners(prev => prev.map(b => 
          b.id === bannerId ? { ...b, is_active: !currentStatus } : b
        ))
        toast.success('Статус баннера изменен')
      }
    } catch (error) {
      toast.error('Ошибка при изменении статуса')
      console.error('Ошибка toggle баннера:', error)
    }
  }

  const handleBannerTrackView = async (bannerId) => {
    try {
      await marketingAPI.adminTrackView(bannerId)
      setBanners(prev => prev.map(banner => 
        banner.id === bannerId 
          ? { ...banner, view_count: (banner.view_count || 0) + 1 }
          : banner
      ))
    } catch (error) {
      console.error('Ошибка отслеживания просмотра:', error)
    }
  }

  const handleBannerTrackClick = async (bannerId) => {
    try {
      await marketingAPI.adminTrackClick(bannerId)
      setBanners(prev => prev.map(banner => 
        banner.id === bannerId 
          ? { ...banner, click_count: (banner.click_count || 0) + 1 }
          : banner
      ))
    } catch (error) {
      console.error('Ошибка отслеживания клика:', error)
    }
  }

  const handleBannerSuccess = () => {
    fetchBanners()
    fetchMarketingStats()
    setShowBannerModal(false)
    setEditingBanner(null)
  }

  const handleCreateSuccess = () => {
    fetchPromoCodes()
    setShowAddForm(false)
    setEditingPromo(null)
  }

  const handleEdit = (promo) => {
    setEditingPromo(promo)
    setShowAddForm(true)
  }

  const togglePromoCodeStatus = async (id, currentStatus) => {
    try {
      await promoAPI.togglePromo(id)
      setPromoCodes(prev => prev.map(code => 
        code.id === id ? { ...code, is_active: !currentStatus } : code
      ))
      toast.success('Статус промокода изменен')
    } catch (error) {
      toast.error('Ошибка при изменении статуса')
      console.error('Ошибка toggle:', error)
    }
  }

  const deletePromoCode = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот промокод?')) {
      try {
        await promoAPI.deletePromo(id)
        setPromoCodes(prev => prev.filter(code => code.id !== id))
        toast.success('Промокод удален')
      } catch (error) {
        toast.error('Ошибка при удалении')
        console.error('Ошибка delete:', error)
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Бессрочно'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const getDiscountText = (type, value) => {
    return type === 'percentage' ? `${value}%` : `${value}₸`
  }

  const getUsageText = (used, limit) => {
    if (!limit) return `${used} использований`
    return `${used} из ${limit}`
  }

  const filteredPromoCodes = promoCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (banner.description && banner.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    banner.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredStories = (stories || []).filter(story =>
    story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.marketingContainer}>
      <div className={styles.header}>
        <h1>Маркетинг</h1>
        <p>Управляйте баннерами, промокодами и маркетинговыми кампаниями</p>
      </div>

      {/* Marketing Stats */}
      {activeTab === 'banners' && marketingStats && Object.keys(marketingStats).length > 0 && (
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <ImageIcon size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{marketingStats.total_banners || 0}</div>
              <div className={styles.statLabel}>Всего баннеров</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Eye size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{marketingStats.total_views || 0}</div>
              <div className={styles.statLabel}>Просмотры</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <MousePointer size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{marketingStats.total_clicks || 0}</div>
              <div className={styles.statLabel}>Клики</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{marketingStats.average_ctr || 0}%</div>
              <div className={styles.statLabel}>Средний CTR</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'banners' ? styles.active : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          <ImageIcon size={18} />
          Баннеры
          {banners.length > 0 && <span className={styles.tabBadge}>{banners.length}</span>}
        </button>
        
        <button 
          className={`${styles.tab} ${activeTab === 'stories' ? styles.active : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          <PlayCircle size={18} />
          Истории
          {(stories || []).length > 0 && <span className={styles.tabBadge}>{(stories || []).length}</span>}
        </button>
        
        <button 
          className={`${styles.tab} ${activeTab === 'promos' ? styles.active : ''}`}
          onClick={() => setActiveTab('promos')}
        >
          <Tag size={18} />
          Промокоды
          {promoCodes.length > 0 && <span className={styles.tabBadge}>{promoCodes.length}</span>}
        </button>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder={
              activeTab === 'banners' ? "Поиск баннеров..." : 
              activeTab === 'stories' ? "Поиск историй..." : 
              "Поиск промокодов..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <button 
          className={styles.addButton}
          onClick={() => {
            if (activeTab === 'banners') {
              setShowBannerModal(true)
            } else if (activeTab === 'stories') {
              setShowStoryModal(true)
            } else {
              setShowAddForm(true)
            }
          }}
        >
          <Plus size={18} />
          {activeTab === 'banners' ? 'Создать баннер' : 
           activeTab === 'stories' ? 'Создать историю' : 
           'Создать промокод'}
        </button>
      </div>

      {/* Контент баннеров */}
      {activeTab === 'banners' && (
        <>
          <div className={styles.bannersGrid}>
            {filteredBanners.map(banner => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={handleBannerEdit}
                onDelete={handleBannerDelete}
                onToggleStatus={handleBannerToggleStatus}
                onTrackView={handleBannerTrackView}
                onTrackClick={handleBannerTrackClick}
              />
            ))}
          </div>

          {filteredBanners.length === 0 && (
            <div className={styles.emptyState}>
              <ImageIcon size={48} />
              <h3>Баннеры не найдены</h3>
              <p>Создайте первый баннер для продвижения ваших акций</p>
            </div>
          )}
        </>
      )}

      {/* Контент историй */}
      {activeTab === 'stories' && (
        <>
          <div className={styles.storiesGrid}>
            {filteredStories.map(story => (
              <div key={story.id} className={styles.storyCard}>
                <div className={styles.storyImages}>
                  <div className={styles.storyImageContainer}>
                    <img 
                      src={story.cover_image || '/placeholder-image.jpg'} 
                      alt="Обложка"
                      className={styles.storyImage}
                    />
                    <span className={styles.imageLabel}>Обложка</span>
                  </div>
                  <div className={styles.storyImageContainer}>
                    <img 
                      src={story.content_image || '/placeholder-image.jpg'} 
                      alt="Содержание"
                      className={styles.storyImage}
                    />
                    <span className={styles.imageLabel}>Содержание</span>
                  </div>
                </div>
                
                <div className={styles.storyInfo}>
                  <h3>{story.title}</h3>
                  {story.description && <p>{story.description}</p>}
                  
                  <div className={styles.storyStats}>
                    <span><Eye size={14} /> {story.view_count || 0}</span>
                    <span><MousePointer size={14} /> {story.click_count || 0}</span>
                  </div>
                  
                  <div className={styles.storyActions}>
                    <button 
                      onClick={() => {
                        setEditingStory(story)
                        setShowStoryModal(true)
                      }}
                      className={styles.editButton}
                    >
                      <Edit3 size={16} />
                    </button>
                    
                    <button 
                      onClick={async () => {
                        if (window.confirm('Удалить эту историю?')) {
                          try {
                            const response = await fetch(`/api/admin/stories/${story.id}`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              }
                            })
                            
                            if (response.ok) {
                              toast.success('История удалена')
                              fetchStories()
                            } else {
                              toast.error('Ошибка удаления истории')
                            }
                          } catch (error) {
                            toast.error('Ошибка удаления истории')
                          }
                        }
                      }}
                      className={styles.deleteButton}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStories.length === 0 && searchTerm && (
            <div className={styles.emptyState}>
              <PlayCircle size={48} />
              <h3>Истории не найдены</h3>
              <p>Попробуйте изменить поисковый запрос</p>
            </div>
          )}

          {(stories || []).length === 0 && !searchTerm && (
            <div className={styles.emptyState}>
              <PlayCircle size={48} />
              <h3>Истории не найдены</h3>
              <p>Создайте первую историю для привлечения внимания клиентов</p>
            </div>
          )}
        </>
      )}

      {/* Список промокодов */}
      {activeTab === 'promos' && (
        <>
          <div className={styles.promoCodesGrid}>
        {filteredPromoCodes.map(code => (
          <div key={code.id} className={styles.promoCodeCard}>
            <div className={styles.promoCodeHeader}>
              <div className={styles.promoCodeCode}>
                <span>{code.code}</span>
                <button 
                  onClick={() => copyPromoCode(code.code)}
                  className={styles.copyButton}
                  title="Копировать код"
                >
                  <Copy size={14} />
                </button>
              </div>
              <div className={`${styles.promoCodeStatus} ${code.is_active ? styles.active : styles.inactive}`}>
                {code.is_active ? (
                  <>
                    <CheckCircle size={14} />
                    Активен
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    Неактивен
                  </>
                )}
              </div>
            </div>

            <div className={styles.promoCodeBody}>
              <h3>{code.name}</h3>
              <p className={styles.promoCodeDescription}>{code.description}</p>
              
              <div className={styles.promoCodeDetails}>
                <div className={styles.detailRow}>
                  <span>Скидка:</span>
                  <span>{getDiscountText(code.discount_type, code.discount_value)}</span>
                </div>
                
                {code.min_order_amount && (
                  <div className={styles.detailRow}>
                    <span>Мин. заказ:</span>
                    <span>{code.min_order_amount}₸</span>
                  </div>
                )}
                
                <div className={styles.detailRow}>
                  <span>Использований:</span>
                  <span>{getUsageText(code.total_used, code.usage_limit)}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <span>Действует до:</span>
                  <span>{formatDate(code.valid_until)}</span>
                </div>
              </div>
            </div>

            <div className={styles.promoCodeActions}>
              <button 
                className={styles.actionButton}
                onClick={() => handleEdit(code)}
              >
                <Edit3 size={16} />
              </button>
              
              <button 
                className={`${styles.actionButton} ${code.is_active ? styles.disableButton : styles.enableButton}`}
                onClick={() => togglePromoCodeStatus(code.id, code.is_active)}
              >
                {code.is_active ? '⏸' : '▶'}
              </button>
              
              <button 
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => deletePromoCode(code.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

          {filteredPromoCodes.length === 0 && (
            <div className={styles.emptyState}>
              <Tag size={48} />
              <h3>Промокоды не найдены</h3>
              <p>Создайте первый промокод для своих клиентов</p>
            </div>
          )}
        </>
      )}
      
      {/* Модальные окна */}
      <PromoCodeModal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false)
          setEditingPromo(null)
        }}
        onSuccess={handleCreateSuccess}
        editingPromo={editingPromo}
      />

      <BannerModal
        isOpen={showBannerModal}
        onClose={() => {
          setShowBannerModal(false)
          setEditingBanner(null)
        }}
        onSuccess={handleBannerSuccess}
        editingBanner={editingBanner}
      />

      {showStoryModal && (
        <StoryModal
          isOpen={showStoryModal}
          onClose={() => {
            setShowStoryModal(false)
            setEditingStory(null)
          }}
          onSuccess={() => {
            fetchStories()
            setShowStoryModal(false)
            setEditingStory(null)
          }}
          editingStory={editingStory}
        />
      )}
    </div>
  )
}

export default MarketingPage
