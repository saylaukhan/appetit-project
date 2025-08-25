import React, { useState, useEffect, useRef } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import styles from './StoryModal.module.css'

const StoryModal = ({ isOpen, onClose, onSuccess, editingStory }) => {
  const [formData, setFormData] = useState({
    title: '',
    cover_image: '',
    content_image: ''
  })
  
  const [coverPreview, setCoverPreview] = useState('')
  const [contentPreview, setContentPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const coverInputRef = useRef()
  const contentInputRef = useRef()

  useEffect(() => {
    if (editingStory) {
      setFormData({
        title: editingStory.title || '',
        cover_image: editingStory.cover_image || '',
        content_image: editingStory.content_image || ''
      })
      setCoverPreview(editingStory.cover_image || '')
      setContentPreview(editingStory.content_image || '')
    } else {
      setFormData({
        title: '',
        cover_image: '',
        content_image: ''
      })
      setCoverPreview('')
      setContentPreview('')
    }
  }, [editingStory, isOpen])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const uploadImage = async (file, type) => {
    if (!file) return null
    
    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения')
      }
      
      const data = await response.json()
      return data.file_path
      
    } catch (error) {
      console.error('Ошибка загрузки:', error)
      toast.error('Ошибка загрузки изображения')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (e, type) => {
    const file = e.target?.files?.[0]
    if (!file) return
    
    await processImageFile(file, type)
  }

  const processImageFile = async (file, type) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Загрузите только изображения (PNG, JPG, WEBP)')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 10MB')
      return
    }
    
    // Показываем превью сразу
    const reader = new FileReader()
    reader.onload = (event) => {
      if (type === 'cover') {
        setCoverPreview(event.target.result)
      } else {
        setContentPreview(event.target.result)
      }
    }
    reader.readAsDataURL(file)
    
    // Загружаем файл на сервер
    const uploadedPath = await uploadImage(file, type)
    if (uploadedPath) {
      setFormData(prev => ({
        ...prev,
        [type === 'cover' ? 'cover_image' : 'content_image']: uploadedPath
      }))
    }
  }

  const handleDrop = async (e, type) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await processImageFile(files[0], type)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Введите название истории')
      return
    }
    
    if (!formData.cover_image || !formData.content_image) {
      toast.error('Загрузите обе картинки (обложку и содержание)')
      return
    }
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = editingStory 
        ? `/api/admin/stories/${editingStory.id}`
        : '/api/admin/stories'
      
      const method = editingStory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        throw new Error('Ошибка сохранения истории')
      }
      
      toast.success(editingStory ? 'История обновлена' : 'История создана')
      onSuccess()
      
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      toast.error('Ошибка сохранения истории')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{editingStory ? 'Редактировать историю' : 'Создать историю'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Название истории *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Введите название истории"
              required
            />
          </div>

          <div className={styles.imagesSection}>
            <div className={styles.imageUpload}>
              <label>Обложка истории *</label>
              <div 
                className={styles.uploadArea} 
                onClick={() => coverInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, 'cover')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
              >
                {coverPreview ? (
                  <div className={styles.imagePreview}>
                    <img src={coverPreview} alt="Обложка" className={styles.previewImage} />
                    <div className={styles.imageOverlay}>
                      <Upload size={20} />
                      <span>Изменить</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <Upload size={40} />
                    <p>Загрузить обложку</p>
                    <small>Нажмите или перетащите файл</small>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
                style={{ display: 'none' }}
              />
            </div>

            <div className={styles.imageUpload}>
              <label>Содержание истории *</label>
              <div 
                className={styles.uploadArea} 
                onClick={() => contentInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, 'content')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
              >
                {contentPreview ? (
                  <div className={styles.imagePreview}>
                    <img src={contentPreview} alt="Содержание" className={styles.previewImage} />
                    <div className={styles.imageOverlay}>
                      <Upload size={20} />
                      <span>Изменить</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <Upload size={40} />
                    <p>Загрузить содержание</p>
                    <small>Нажмите или перетащите файл</small>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={contentInputRef}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'content')}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={loading || uploading}
            >
              {loading ? 'Сохранение...' : uploading ? 'Загрузка...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StoryModal