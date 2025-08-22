import React, { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import styles from './AddressModal.module.css'

// Координаты Усть-Каменогорска
const defaultCenter = {
  lat: 49.948265,
  lng: 82.628062
}

// Исправляем иконку маркера для Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Компонент для обработки кликов по карте
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
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
  const [locationError, setLocationError] = useState(null)

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
      setLocationError('Геолокация не поддерживается вашим браузером')
      return
    }

    setIsLoadingLocation(true)
    setLocationError(null)

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
        setIsLoadingLocation(false)

        // Определяем тип ошибки и показываем соответствующее сообщение
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Доступ к геолокации запрещен. Разрешите доступ в настройках браузера')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Информация о местоположении недоступна')
            break
          case error.TIMEOUT:
            setLocationError('Превышено время ожидания определения местоположения')
            break
          default:
            setLocationError('Произошла ошибка при определении местоположения')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
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

          // Извлекаем компоненты адреса
          const city = address.city || address.town || address.village || address.city_district || 'Усть-Каменогорск'
          const street = address.road || address.street || address.pedestrian || address.path || ''
          const houseNumber = address.house_number || ''

          // Формируем полный адрес
          const streetWithNumber = houseNumber && street ? `${street} ${houseNumber}` : street || houseNumber || 'Неизвестный адрес'

          setFormData(prev => ({
            ...prev,
            city: city,
            street: streetWithNumber,
            fullAddress: `${city}, ${streetWithNumber}`
          }))
        }
      }
    } catch (error) {
      console.error('Ошибка обратного геокодирования:', error)
      // В случае ошибки показываем базовый адрес
      setFormData(prev => ({
        ...prev,
        fullAddress: `${prev.city}, координаты: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }))
    }
  }

  // Обработка клика по карте
  const handleMapClick = useCallback((lat, lng) => {
    const newPosition = { lat, lng }
    setMarkerPosition(newPosition)
    setMapCenter(newPosition) // Центрируем карту на новом маркере
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
      console.warn('Адрес не указан')
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
    onClose() // Закрываем модальное окно сразу после сохранения
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
              <div className={styles.locationButtonGroup}>
                <div className={styles.locationButtonContainer}>
                  <span className={styles.locationIcon}>📍</span>
                  <button
                    className={styles.locationBtn}
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? 'Определение...' : 'Мое местоположение'}
                  </button>
                </div>
                {locationError && (
                  <div className={styles.errorMessage}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <span>{locationError}</span>
                    <button
                      className={styles.retryBtn}
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      title="Попробовать снова"
                    >
                      ↻
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.mapHints}>
                <span className={styles.mapHint}>
                  Нажмите на карту, чтобы указать точное местоположение
                </span>
                <span className={styles.locationHint}>
                  💡 Для определения местоположения нужно разрешить доступ к геолокации в браузере
                </span>
              </div>
            </div>

            <div className={styles.mapContainer}>
              <MapContainer
                center={mapCenter}
                zoom={15}
                style={{
                  width: '100%',
                  height: '300px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}
                whenReady={(map) => {
                  // Центрируем карту на маркере при загрузке
                  map.target.flyTo(markerPosition, 15)
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                <Marker position={markerPosition}>
                  <Popup>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Выбранное место</strong>
                      <br />
                      <small>Кликните в другом месте, чтобы изменить</small>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
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
