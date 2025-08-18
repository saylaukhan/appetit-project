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
  AlertCircle
} from 'lucide-react'
import { marketingAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './MarketingPage.module.css'

function MarketingPage() {
  const [promoCodes, setPromoCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      // Моковые данные
      setTimeout(() => {
        const mockPromoCodes = [
          {
            id: 1,
            code: 'WELCOME10',
            name: 'Скидка для новых клиентов',
            description: '10% скидка на первый заказ',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            minOrderAmount: 2000,
            totalUsed: 156,
            usageLimit: null,
            validUntil: '2025-12-31T23:59:59Z',
            isActive: true
          },
          {
            id: 2,
            code: 'PIZZA20',
            name: 'Скидка на пиццу',
            description: '20% скидка на любую пиццу',
            discountType: 'PERCENTAGE',
            discountValue: 20,
            minOrderAmount: 2500,
            totalUsed: 89,
            usageLimit: 500,
            validUntil: '2025-02-15T23:59:59Z',
            isActive: true
          },
          {
            id: 3,
            code: 'DELIVERY500',
            name: 'Бесплатная доставка',
            description: '500 тг скидка на доставку',
            discountType: 'FIXED',
            discountValue: 500,
            minOrderAmount: 1500,
            totalUsed: 234,
            usageLimit: 1000,
            validUntil: '2025-03-01T23:59:59Z',
            isActive: false
          }
        ]
        
        setPromoCodes(mockPromoCodes)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Ошибка загрузки промокодов:', error)
      setLoading(false)
    }
  }

  const copyPromoCode = (code) => {
    navigator.clipboard.writeText(code)
  }

  const togglePromoCodeStatus = async (id, currentStatus) => {
    setPromoCodes(prev => prev.map(code => 
      code.id === id ? { ...code, isActive: !currentStatus } : code
    ))
  }

  const deletePromoCode = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот промокод?')) {
      setPromoCodes(prev => prev.filter(code => code.id !== id))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Бессрочно'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const getDiscountText = (type, value) => {
    return type === 'PERCENTAGE' ? `${value}%` : `${value}₸`
  }

  const getUsageText = (used, limit) => {
    if (!limit) return `${used} использований`
    return `${used} из ${limit}`
  }

  const filteredPromoCodes = promoCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.marketingContainer}>
      <div className={styles.header}>
        <h1>Маркетинг и промокоды</h1>
        <p>Управляйте промокодами и маркетинговыми кампаниями</p>
      </div>

      <div className={styles.sectionHeader}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск промокодов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <button 
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} />
          Создать промокод
        </button>
      </div>

      {/* Список промокодов */}
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
              <div className={`${styles.promoCodeStatus} ${code.isActive ? styles.active : styles.inactive}`}>
                {code.isActive ? (
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
                  <span>{getDiscountText(code.discountType, code.discountValue)}</span>
                </div>
                
                {code.minOrderAmount && (
                  <div className={styles.detailRow}>
                    <span>Мин. заказ:</span>
                    <span>{code.minOrderAmount}₸</span>
                  </div>
                )}
                
                <div className={styles.detailRow}>
                  <span>Использований:</span>
                  <span>{getUsageText(code.totalUsed, code.usageLimit)}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <span>Действует до:</span>
                  <span>{formatDate(code.validUntil)}</span>
                </div>
              </div>
            </div>

            <div className={styles.promoCodeActions}>
              <button 
                className={styles.actionButton}
                onClick={() => console.log('Редактировать', code.id)}
              >
                <Edit3 size={16} />
              </button>
              
              <button 
                className={`${styles.actionButton} ${code.isActive ? styles.disableButton : styles.enableButton}`}
                onClick={() => togglePromoCodeStatus(code.id, code.isActive)}
              >
                {code.isActive ? '⏸' : '▶'}
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
    </div>
  )
}

export default MarketingPage
