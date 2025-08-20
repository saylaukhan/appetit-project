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
import { promoAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import PromoCodeModal from '../../components/admin/PromoCodeModal'
import styles from './MarketingPage.module.css'

function MarketingPage() {
  const [promoCodes, setPromoCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)

  useEffect(() => {
    fetchPromoCodes()
  }, [])

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

  const copyPromoCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Промокод скопирован!')
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
      
      {/* Модальное окно создания/редактирования промокода */}
      <PromoCodeModal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false)
          setEditingPromo(null)
        }}
        onSuccess={handleCreateSuccess}
        editingPromo={editingPromo}
      />
    </div>
  )
}

export default MarketingPage
