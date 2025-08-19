import React, { useState, useEffect } from 'react'
import { X, DollarSign } from 'lucide-react'
import { menuAPI } from '../../services/api'
import styles from './AddAddonModal.module.css'

const AddAddonModal = ({ isOpen, onClose, onAddonSaved, editingAddon = null, existingCategories = [] }) => {
  const isEditMode = !!editingAddon
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)

  // Инициализация формы при открытии/закрытии
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        price: '',
        category: ''
      })
      setErrors({})
      setShowNewCategoryInput(false)
    } else if (isEditMode && editingAddon) {
      // Заполняем форму данными для редактирования
      setFormData({
        name: editingAddon.name || '',
        price: editingAddon.price?.toString() || '',
        category: editingAddon.category || ''
      })
    }
  }, [isOpen, isEditMode, editingAddon])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Очищаем ошибку для поля при изменении
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Показываем поле для новой категории
    if (name === 'categorySelect' && value === 'new') {
      setShowNewCategoryInput(true)
      setFormData(prev => ({ ...prev, category: '' }))
    } else if (name === 'categorySelect' && value !== 'new') {
      setShowNewCategoryInput(false)
      setFormData(prev => ({ ...prev, category: value }))
    }
  }



  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно'
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Цена должна быть больше или равна 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Подготавливаем данные для отправки
      const addonData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim() || null
      }

      // Отправляем на сервер
      try {
        let response
        if (isEditMode) {
          // Обновляем существующую добавку
          response = await menuAPI.updateAddon(editingAddon.id, addonData)
        } else {
          // Создаем новую добавку
          response = await menuAPI.createAddon(addonData)
        }
        
        onAddonSaved(response.data)
      } catch (apiError) {
        console.error('Ошибка при сохранении добавки:', apiError)
        setErrors({ submit: `Ошибка при ${isEditMode ? 'обновлении' : 'создании'} добавки. Попробуйте еще раз.` })
        setIsSubmitting(false)
        return
      }
      
      // Закрываем модал
      onClose()

    } catch (error) {
      console.error('Ошибка создания добавки:', error)
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          setErrors({ submit: error.response.data.detail })
        } else if (Array.isArray(error.response.data.detail)) {
          // Обработка ошибок валидации от FastAPI
          const validationErrors = {}
          error.response.data.detail.forEach(err => {
            if (err.loc && err.loc.length > 1) {
              validationErrors[err.loc[1]] = err.msg
            }
          })
          setErrors(validationErrors)
        }
      } else {
        setErrors({ submit: 'Произошла ошибка при создании добавки' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? 'Редактировать добавку' : 'Добавить добавку'}</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Основная информация */}
          <div className={styles.formSection}>
            <h3>Основная информация</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="name">Название добавки *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? styles.error : ''}
                placeholder="Введите название добавки"
                disabled={isSubmitting}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="price">Цена (₸) *</label>
                <div className={styles.inputWithIcon}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={errors.price ? styles.error : ''}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.price && <span className={styles.errorText}>{errors.price}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                name="categorySelect"
                value={showNewCategoryInput ? 'new' : formData.category}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value="">Без категории</option>
                {existingCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="new">+ Создать новую категорию</option>
              </select>
            </div>

            {showNewCategoryInput && (
              <div className={styles.formGroup}>
                <label htmlFor="newCategory">Название новой категории</label>
                <input
                  type="text"
                  id="newCategory"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Введите название категории"
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>



          {/* Ошибки отправки */}
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}

          {/* Кнопки */}
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || uploadingImage}
            >
              {isSubmitting 
                ? (uploadingImage ? 'Загружается изображение...' : (isEditMode ? 'Сохранение...' : 'Создание...'))
                : (isEditMode ? 'Сохранить изменения' : 'Создать добавку')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAddonModal
