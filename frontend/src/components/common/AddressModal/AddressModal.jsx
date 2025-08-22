import React, { useState, useEffect, useCallback } from 'react'
import styles from './AddressModal.module.css'

// Простая карта без API ключа - используем OpenStreetMap
const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0'
}

const defaultCenter = {
  lat: 49.948265,
  lng: 82.628062 // Координаты Усть-Каменогорска
}

function AddressModal({ isOpen, onClose, onSave, initialAddress = null }) {
  const [formData, setFormData] = useState({
    city: 'Усть-Каменогорск',
    street: '',
    fullAddress: '', // Новое поле для полного адреса
    entrance: '',
    floor: '',
    apartment: '',
    comment: ''
  })
  
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [markerPosition, setMarkerPosition] = useState(defaultCenter)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Заполняем форму начальными данными
  useEffect(() => {
    if (initialAddress) {
      const fullAddr = initialAddress.address || `${initialAddress.address_city || 'Усть-Каменогорск'}, ${initialAddress.address_street || ''}`
      setFormData({
        city: initialAddress.address_city || 'Усть-Каменогорск',
        street: initialAddress.address_street || '',
        fullAddress: fullAddr,
        entrance: initialAddress.address_entrance || '',
        floor: initialAddress.address_floor || '',
        apartment: initialAddress.address_apartment || '',
        comment: initialAddress.address_comment || ''
      })
      
      if (initialAddress.address_latitude && initialAddress.address_longitude) {
        const position = {
          lat: initialAddress.address_latitude,
          lng: initialAddress.address_longitude
        }
        setMapCenter(position)
        setMarkerPosition(position)
      }
    } else {
      // Инициализируем полный адрес для нового адреса
      setFormData(prev => ({
        ...prev,
        fullAddress: `${prev.city}, `
      }))
    }
  }, [initialAddress])

  // Получение текущего местоположения
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером')
      return
    }

    setIsLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newPosition = { lat: latitude, lng: longitude }
        
        setMapCenter(newPosition)
        setMarkerPosition(newPosition)
        
        // Получаем адрес по координатам
        reverseGeocode(latitude, longitude)
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error('Ошибка получения геолокации:', error)
        alert('Не удалось получить ваше местоположение')
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }, [])

  // Простое обратное геокодирование с использованием Nominatim API (OpenStreetMap)
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.address) {
          const address = data.address
          
          // Извлекаем город и улицу
          const city = address.city || address.town || address.village || 'Усть-Каменогорск'
          const street = [
            address.house_number,
            address.road || address.street
          ].filter(Boolean).join(' ')
          
          setFormData(prev => ({
            ...prev,
            city: city,
            street: street || prev.street,
            fullAddress: `${city}, ${street || prev.street}`
          }))
        }
      }
    } catch (error) {
      console.error('Ошибка обратного геокодирования:', error)
    }
  }

  // Обработка клика по карте - теперь без Google Maps API
  const handleMapClick = useCallback((lat, lng) => {
    setMarkerPosition({ lat, lng })
    reverseGeocode(lat, lng)
  }, [])

  // Обработка изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Сохранение адреса
  const handleSave = () => {
    if (!formData.fullAddress.trim()) {
      alert('Пожалуйста, укажите адрес')
      return
    }

    // Разбираем полный адрес на город и улицу при сохранении
    let city = 'Усть-Каменогорск'
    let street = formData.fullAddress
    
    if (formData.fullAddress.includes(',')) {
      const parts = formData.fullAddress.split(',')
      city = parts[0].trim()
      street = parts.slice(1).join(',').trim()
    }

    const addressData = {
      address: formData.fullAddress,
      address_city: city,
      address_street: street,
      address_entrance: formData.entrance || null,
      address_floor: formData.floor || null,
      address_apartment: formData.apartment || null,
      address_comment: formData.comment || null,
      address_latitude: markerPosition.lat,
      address_longitude: markerPosition.lng
    }

    onSave(addressData)
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Укажите ваш адрес</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Геолокация и карта */}
          <div className={styles.mapSection}>
            <div className={styles.locationControls}>
              <button 
                className={styles.locationBtn}
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? 'Определение...' : '📍 Мое местоположение'}
              </button>
              <span className={styles.mapHint}>
                Нажмите на карту, чтобы указать точное местоположение
              </span>
            </div>

            <div className={styles.mapContainer}>
              <iframe
                style={mapContainerStyle}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${markerPosition.lng-0.01},${markerPosition.lat-0.01},${markerPosition.lng+0.01},${markerPosition.lat+0.01}&layer=mapnik&marker=${markerPosition.lat},${markerPosition.lng}`}
                frameBorder="0"
                scrolling="no"
                title="Карта"
              ></iframe>

            </div>
          </div>

          {/* Форма адреса */}
          <div className={styles.formSection}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Город, улица и дом*</label>
                <input
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      fullAddress: value
                    }))
                  }}
                  placeholder="Усть-Каменогорск, улица Казахстан, 62"
                  className={styles.addressInput}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Подъезд</label>
                  <input
                    type="text"
                    name="entrance"
                    value={formData.entrance}
                    onChange={handleInputChange}
                    placeholder="1"
                    className={styles.smallInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Этаж</label>
                  <input
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="5"
                    className={styles.smallInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Квартира</label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="25"
                    className={styles.smallInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Комментарий к адресу</label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Дополнительная информация для курьера"
                  className={styles.commentInput}
                  rows="3"
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Сохранить адрес
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddressModal
