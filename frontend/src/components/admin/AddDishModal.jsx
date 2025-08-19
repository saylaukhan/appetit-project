import React, { useState, useEffect } from 'react'
import { X, Upload, DollarSign } from 'lucide-react'
import { menuAPI, filesAPI } from '../../services/api'
import styles from './AddDishModal.module.css'

const AddDishModal = ({ isOpen, onClose, onDishAdded, onDishUpdated, categories = [], editingDish = null }) => {
  const isEditMode = !!editingDish
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image: '',
    is_popular: false,
    is_available: true
  })
  
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState({})
  const [availableAddons, setAvailableAddons] = useState([])
  const [selectedAddons, setSelectedAddons] = useState([])

  // Загружаем добавки при открытии модала
  useEffect(() => {
    if (isOpen) {
      loadAddons()
    }
  }, [isOpen])

  // Инициализация формы при открытии/закрытии
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image: '',
        is_popular: false,
        is_available: true
      })
      setImageFile(null)
      setImagePreview('')
      setErrors({})
      setSelectedAddons([])
    } else if (isEditMode && editingDish) {
      // Заполняем форму данными для редактирования
      setFormData({
        name: editingDish.name || '',
        description: editingDish.description || '',
        price: editingDish.price?.toString() || '',
        category_id: editingDish.categoryId?.toString() || '',
        image: editingDish.image || '',
        is_popular: editingDish.popular || false,
        is_available: editingDish.available !== undefined ? editingDish.available : true
      })
      setImagePreview(editingDish.image || '')
      setSelectedAddons(editingDish.addons?.map(addon => addon.id) || [])
    }
  }, [isOpen, isEditMode, editingDish])

  const loadAddons = async () => {
    try {
      const response = await menuAPI.getAddons({ show_all: false })
      setAvailableAddons(response.data)
    } catch (error) {
      console.error('Ошибка загрузки добавок:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Очищаем ошибку для поля при изменении
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleAddonToggle = (addonId) => {
    setSelectedAddons(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId)
      } else {
        return [...prev, addonId]
      }
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        image: 'Выберите файл изображения'
      }))
      return
    }

    // Проверяем размер файла (макс 5МБ)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        image: 'Размер файла не должен превышать 5МБ'
      }))
      return
    }

    setImageFile(file)
    
    // Создаем превью
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Очищаем ошибку
    if (errors.image) {
      setErrors(prev => ({
        ...prev,
        image: ''
      }))
    }
  }

  const uploadImage = async () => {
    if (!imageFile) return ''

    setUploadingImage(true)
    try {
      // ВРЕМЕННАЯ ЗАГЛУШКА для тестирования
      await new Promise(resolve => setTimeout(resolve, 1000))
      return `https://via.placeholder.com/200x150/3b82f6/ffffff?text=${encodeURIComponent(formData.name || 'Блюдо')}`
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error)
      throw new Error('Не удалось загрузить изображение')
    } finally {
      setUploadingImage(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Цена должна быть больше 0'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Выберите категорию'
    }



    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Загружаем изображение если оно есть
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadImage()
      }

      // Подготавливаем данные для отправки
      const dishData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        image: imageUrl || formData.image || null,
        is_popular: formData.is_popular,
        is_available: formData.is_available,
        addon_ids: selectedAddons
      }

      // Отправляем на сервер
      try {
        if (isEditMode) {
          // Обновляем существующее блюдо
          const response = await menuAPI.updateDish(editingDish.id, dishData)
          onDishUpdated && onDishUpdated(response.data)
        } else {
          // Создаем новое блюдо
          const response = await menuAPI.createDish(dishData)
          onDishAdded && onDishAdded(response.data)
        }
      } catch (apiError) {
        console.error('Ошибка при сохранении блюда:', apiError)
        setErrors({ submit: `Ошибка при ${isEditMode ? 'обновлении' : 'создании'} блюда. Попробуйте еще раз.` })
        setIsSubmitting(false)
        return
      }
      
      // Закрываем модал
      onClose()

    } catch (error) {
      console.error('Ошибка создания блюда:', error)
      
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
        setErrors({ submit: 'Произошла ошибка при создании блюда' })
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
          <h2>{isEditMode ? 'Редактировать блюдо' : 'Добавить блюдо'}</h2>
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
              <label htmlFor="name">Название блюда *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? styles.error : ''}
                placeholder="Введите название блюда"
                disabled={isSubmitting}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Описание блюда"
                rows="3"
                disabled={isSubmitting}
              />
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
              <label htmlFor="category_id">Категория *</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={errors.category_id ? styles.error : ''}
                disabled={isSubmitting}
              >
                <option value="">Выберите категорию</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <span className={styles.errorText}>{errors.category_id}</span>}
            </div>
          </div>

          {/* Изображение */}
          <div className={styles.formSection}>
            <h3>Изображение</h3>
            
            <div className={styles.imageUpload}>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                disabled={isSubmitting || uploadingImage}
              />
              
              <label htmlFor="image" className={styles.imageUploadLabel}>
                {imagePreview ? (
                  <div className={styles.imagePreview}>
                    <img src={imagePreview} alt="Preview" />
                    <div className={styles.imageOverlay}>
                      <Upload size={20} />
                      <span>Изменить изображение</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.imageUploadPlaceholder}>
                    <Upload size={24} />
                    <span>Загрузить изображение</span>
                    <small>JPG, PNG до 5МБ</small>
                  </div>
                )}
              </label>
              
              {errors.image && <span className={styles.errorText}>{errors.image}</span>}
            </div>
          </div>

          {/* Добавки */}
          {availableAddons.length > 0 && (
            <div className={styles.formSection}>
              <h3>Доступные добавки</h3>
              <p className={styles.sectionDescription}>
                Выберите добавки, которые можно будет заказать с этим блюдом
              </p>
              
              <div className={styles.addonsGrid}>
                {availableAddons.map(addon => (
                  <label 
                    key={addon.id} 
                    className={`${styles.addonOption} ${selectedAddons.includes(addon.id) ? styles.selected : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAddons.includes(addon.id)}
                      onChange={() => handleAddonToggle(addon.id)}
                      disabled={isSubmitting}
                      style={{ display: 'none' }}
                    />
                    <div className={styles.addonInfo}>
                      <span className={styles.addonName}>{addon.name}</span>
                      <span className={styles.addonPrice}>+{addon.price}₸</span>
                      {addon.category && (
                        <span className={styles.addonCategory}>{addon.category}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Настройки */}
          <div className={styles.formSection}>
            <h3>Настройки</h3>
            
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_popular"
                  checked={formData.is_popular}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <span>Популярное блюдо</span>
              </label>
              
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <span>Доступно для заказа</span>
              </label>
            </div>
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
                : (isEditMode ? 'Сохранить изменения' : 'Создать блюдо')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddDishModal
