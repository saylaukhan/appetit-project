import React, { useState, useEffect } from 'react'
import { X, Upload, Calendar, MapPin, Eye, BarChart3, Link } from 'lucide-react'
import { marketingAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import styles from './BannerModal.module.css'

const BannerModal = ({ isOpen, onClose, onSuccess, editingBanner = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
    position: 'main',
    sort_order: 1,
    is_active: true,
    show_from: '',
    show_until: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  // Позиции баннеров с их описаниями
  const positions = [
    { value: 'main', label: 'Главная страница', color: '#e74c3c', icon: '🏠' },
    { value: 'hero', label: 'Героический баннер', color: '#9b59b6', icon: '⭐' },
    { value: 'featured', label: 'Рекомендуемые', color: '#3498db', icon: '👍' },
    { value: 'category', label: 'Страница категории', color: '#f39c12', icon: '📂' },
    { value: 'cart', label: 'Корзина', color: '#27ae60', icon: '🛒' },
    { value: 'checkout', label: 'Оформление заказа', color: '#e67e22', icon: '💳' },
    { value: 'popup', label: 'Всплывающее окно', color: '#e74c3c', icon: '⚠️' },
    { value: 'notification', label: 'Уведомление', color: '#34495e', icon: '🔔' }
  ]

  useEffect(() => {
    if (editingBanner) {
      setFormData({
        title: editingBanner.title || '',
        description: editingBanner.description || '',
        image: editingBanner.image || '',
        link: editingBanner.link || '',
        position: editingBanner.position || 'main',
        sort_order: editingBanner.sort_order || 1,
        is_active: editingBanner.is_active || true,
        show_from: editingBanner.show_from ? editingBanner.show_from.split('T')[0] : '',
        show_until: editingBanner.show_until ? editingBanner.show_until.split('T')[0] : ''
      })
      setImagePreview(editingBanner.image || '')
    } else {
      setFormData({
        title: '',
        description: '',
        image: '',
        link: '',
        position: 'main',
        sort_order: 1,
        is_active: true,
        show_from: '',
        show_until: ''
      })
      setImagePreview('')
    }
  }, [editingBanner, isOpen])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, image: value }))
    setImagePreview(value)
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Введите название баннера')
      return false
    }
    if (!formData.position) {
      toast.error('Выберите позицию баннера')
      return false
    }
    if (formData.show_from && formData.show_until && formData.show_from > formData.show_until) {
      toast.error('Дата начала показа не может быть позже даты окончания')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const bannerData = {
        ...formData,
        sort_order: parseInt(formData.sort_order) || 1,
        show_from: formData.show_from ? new Date(formData.show_from).toISOString() : null,
        show_until: formData.show_until ? new Date(formData.show_until).toISOString() : null
      }

      if (editingBanner) {
        await marketingAPI.updateBanner(editingBanner.id, bannerData)
        toast.success('Баннер успешно обновлен!')
      } else {
        await marketingAPI.createBanner(bannerData)
        toast.success('Баннер успешно создан!')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Ошибка при сохранении баннера:', error)
      toast.error(
        error.response?.data?.detail || 
        'Ошибка при сохранении баннера'
      )
    } finally {
      setLoading(false)
    }
  }

  const getPositionStyle = (positionValue) => {
    const position = positions.find(p => p.value === positionValue)
    return position ? { backgroundColor: position.color, color: 'white' } : {}
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <BarChart3 className={styles.titleIcon} />
            <h2>{editingBanner ? 'Редактировать баннер' : 'Создать баннер'}</h2>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Превью баннера */}
          {imagePreview && (
            <div className={styles.previewSection}>
              <div className={styles.previewLabel}>Превью баннера</div>
              <div 
                className={styles.bannerPreview}
                style={getPositionStyle(formData.position)}
              >
                {imagePreview.startsWith('http') ? (
                  <img src={imagePreview} alt="Превью" className={styles.previewImage} />
                ) : (
                  <div className={styles.previewPlaceholder}>
                    <Upload size={24} />
                    <span>Изображение</span>
                  </div>
                )}
                <div className={styles.previewContent}>
                  <h3>{formData.title || 'Название баннера'}</h3>
                  <p>{formData.description || 'Описание баннера'}</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.formGrid}>
            {/* Основная информация */}
            <div className={styles.formSection}>
              <h3>Основная информация</h3>
              
              <div className={styles.formField}>
                <label htmlFor="title">Название баннера *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Например: Скидка 50% на пиццу"
                  required
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="description">Описание</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Подробное описание акции или предложения"
                  rows="3"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="image">
                  <Upload size={16} />
                  URL изображения
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleImageChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="link">
                  <Link size={16} />
                  Ссылка при клике
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="/menu/pizza или https://external-link.com"
                />
              </div>
            </div>

            {/* Позиционирование */}
            <div className={styles.formSection}>
              <h3>Размещение</h3>
              
              <div className={styles.formField}>
                <label htmlFor="position">
                  <MapPin size={16} />
                  Позиция показа *
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                >
                  {positions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.icon} {pos.label}
                    </option>
                  ))}
                </select>
                <div className={styles.positionPreview} style={getPositionStyle(formData.position)}>
                  {positions.find(p => p.value === formData.position)?.icon} 
                  {positions.find(p => p.value === formData.position)?.label}
                </div>
              </div>

              <div className={styles.formField}>
                <label htmlFor="sort_order">Порядок сортировки</label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                />
                <small>Меньшее число = показывается первым</small>
              </div>

              <div className={styles.checkboxField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span className={styles.checkmark}>
                    <Eye size={14} />
                  </span>
                  Активный баннер
                </label>
              </div>
            </div>

            {/* Временные ограничения */}
            <div className={styles.formSection}>
              <h3>Время показа</h3>
              
              <div className={styles.dateGrid}>
                <div className={styles.formField}>
                  <label htmlFor="show_from">
                    <Calendar size={16} />
                    Показывать с
                  </label>
                  <input
                    type="date"
                    id="show_from"
                    name="show_from"
                    value={formData.show_from}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="show_until">
                    <Calendar size={16} />
                    Показывать до
                  </label>
                  <input
                    type="date"
                    id="show_until"
                    name="show_until"
                    value={formData.show_until}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <small>Оставьте пустым для постоянного показа</small>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : editingBanner ? 'Обновить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BannerModal