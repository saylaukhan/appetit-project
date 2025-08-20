import React, { useState, useEffect } from 'react'
import { X, Tag, Percent, DollarSign, Calendar, Users, Package, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { promoAPI } from '../../services/api'
import styles from './PromoCodeModal.module.css'

function PromoCodeModal({ isOpen, onClose, onSuccess, editingPromo = null }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    usage_limit_per_user: '1',
    valid_until: '',
    is_active: true
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editingPromo) {
      setFormData({
        code: editingPromo.code,
        name: editingPromo.name,
        description: editingPromo.description || '',
        discount_type: editingPromo.discount_type,
        discount_value: editingPromo.discount_value,
        min_order_amount: editingPromo.min_order_amount || '',
        max_discount_amount: editingPromo.max_discount_amount || '',
        usage_limit: editingPromo.usage_limit || '',
        usage_limit_per_user: editingPromo.usage_limit_per_user,
        valid_until: editingPromo.valid_until ? new Date(editingPromo.valid_until).toISOString().split('T')[0] : '',
        is_active: editingPromo.is_active
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        usage_limit_per_user: '1',
        valid_until: '',
        is_active: true
      })
    }
    setErrors({})
  }, [editingPromo, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Очищаем ошибку для поля при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.code.trim()) {
      newErrors.code = 'Код промокода обязателен'
    } else if (formData.code.length < 3) {
      newErrors.code = 'Код должен содержать минимум 3 символа'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название промокода обязательно'
    }
    
    if (!formData.discount_value || formData.discount_value <= 0) {
      newErrors.discount_value = 'Размер скидки должен быть больше 0'
    }
    
    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Процентная скидка не может превышать 100%'
    }
    
    if (formData.min_order_amount && formData.min_order_amount < 0) {
      newErrors.min_order_amount = 'Минимальная сумма не может быть отрицательной'
    }
    
    if (formData.usage_limit_per_user && formData.usage_limit_per_user < 1) {
      newErrors.usage_limit_per_user = 'Лимит на пользователя должен быть минимум 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме')
      return
    }

    setLoading(true)
    
    try {
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_user: parseInt(formData.usage_limit_per_user),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
      }

      if (editingPromo) {
        await promoAPI.updatePromo(editingPromo.id, submitData)
        toast.success('Промокод обновлен!')
      } else {
        await promoAPI.createPromo(submitData)
        toast.success('Промокод создан!')
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Ошибка сохранения промокода:', error)
      const errorMessage = error.response?.data?.detail || 'Ошибка при сохранении промокода'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>
            <Tag size={20} />
            {editingPromo ? 'Редактировать промокод' : 'Создать промокод'}
          </h2>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGrid}>
            {/* Код промокода */}
            <div className={styles.formGroup}>
              <label>
                <Tag size={16} />
                Код промокода *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Например: WELCOME10"
                className={errors.code ? styles.error : ''}
                disabled={loading}
              />
              {errors.code && <span className={styles.errorText}>{errors.code}</span>}
            </div>

            {/* Название */}
            <div className={styles.formGroup}>
              <label>Название *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Скидка для новых клиентов"
                className={errors.name ? styles.error : ''}
                disabled={loading}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            {/* Описание */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Описание для клиентов"
                rows="2"
                disabled={loading}
              />
            </div>

            {/* Тип скидки */}
            <div className={styles.formGroup}>
              <label>Тип скидки</label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="percentage">Процентная (%)</option>
                <option value="fixed">Фиксированная (₸)</option>
              </select>
            </div>

            {/* Размер скидки */}
            <div className={styles.formGroup}>
              <label>
                {formData.discount_type === 'percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                Размер скидки *
              </label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                placeholder={formData.discount_type === 'percentage' ? '10' : '500'}
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '50'}
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                className={errors.discount_value ? styles.error : ''}
                disabled={loading}
              />
              {errors.discount_value && <span className={styles.errorText}>{errors.discount_value}</span>}
            </div>

            {/* Минимальная сумма заказа */}
            <div className={styles.formGroup}>
              <label>
                <Package size={16} />
                Мин. сумма заказа (₸)
              </label>
              <input
                type="number"
                name="min_order_amount"
                value={formData.min_order_amount}
                onChange={handleChange}
                placeholder="1500"
                min="0"
                step="50"
                className={errors.min_order_amount ? styles.error : ''}
                disabled={loading}
              />
              {errors.min_order_amount && <span className={styles.errorText}>{errors.min_order_amount}</span>}
            </div>

            {/* Максимальная сумма скидки (только для процентных) */}
            {formData.discount_type === 'percentage' && (
              <div className={styles.formGroup}>
                <label>Макс. сумма скидки (₸)</label>
                <input
                  type="number"
                  name="max_discount_amount"
                  value={formData.max_discount_amount}
                  onChange={handleChange}
                  placeholder="500"
                  min="0"
                  step="50"
                  disabled={loading}
                />
              </div>
            )}

            {/* Общий лимит использований */}
            <div className={styles.formGroup}>
              <label>
                <Users size={16} />
                Общий лимит использований
              </label>
              <input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleChange}
                placeholder="100"
                min="1"
                disabled={loading}
              />
            </div>

            {/* Лимит на пользователя */}
            <div className={styles.formGroup}>
              <label>Лимит на пользователя *</label>
              <input
                type="number"
                name="usage_limit_per_user"
                value={formData.usage_limit_per_user}
                onChange={handleChange}
                placeholder="1"
                min="1"
                className={errors.usage_limit_per_user ? styles.error : ''}
                disabled={loading}
              />
              {errors.usage_limit_per_user && <span className={styles.errorText}>{errors.usage_limit_per_user}</span>}
            </div>

            {/* Дата окончания */}
            <div className={styles.formGroup}>
              <label>
                <Calendar size={16} />
                Действует до
              </label>
              <input
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>

            {/* Статус */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className={styles.checkboxText}>Промокод активен</span>
              </label>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : (editingPromo ? 'Обновить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PromoCodeModal
