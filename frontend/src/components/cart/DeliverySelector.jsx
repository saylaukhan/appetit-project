import React from 'react'
import styles from './DeliverySelector.module.css'

function DeliverySelector({ selectedType, onTypeChange }) {
  const deliveryOptions = [
    {
      type: 'delivery',
      title: 'Доставка',
      description: 'Доставим по указанному адресу',
      price: 199,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path 
            d="M1 3H3L3.4 5M7 13H17L21 5H3.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17A2 2 0 0 1 15 19H9A2 2 0 0 1 7 17V13M17 13H7" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M16 8L20 12L16 16" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      )
    },
    {
      type: 'pickup',
      title: 'Самовывоз',
      description: 'Заберите сами из ресторана',
      price: 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path 
            d="M19 7H5A2 2 0 0 0 3 9V18A2 2 0 0 0 5 20H14M19 7L16 10L19 13M19 7V13M19 13H14M14 20V13M14 13H5" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      )
    }
  ]

  return (
    <div className={styles.deliverySelector}>
      <h4 className={styles.selectorTitle}>Способ получения заказа</h4>
      
      <div className={styles.optionsContainer}>
        {deliveryOptions.map((option) => (
          <label 
            key={option.type}
            className={`${styles.deliveryOption} ${
              selectedType === option.type ? styles.selected : ''
            }`}
          >
            <input
              type="radio"
              name="deliveryType"
              value={option.type}
              checked={selectedType === option.type}
              onChange={(e) => onTypeChange(e.target.value)}
              className={styles.hiddenRadio}
            />
            
            <div className={styles.optionContent}>
              <div className={styles.optionHeader}>
                <div className={styles.optionIcon}>
                  {option.icon}
                </div>
                <div className={styles.optionInfo}>
                  <div className={styles.optionTitle}>{option.title}</div>
                  <div className={styles.optionDescription}>{option.description}</div>
                </div>
              </div>
              
              <div className={styles.optionPrice}>
                {option.price > 0 ? `${option.price} ₸` : 'Бесплатно'}
              </div>
            </div>
            
            <div className={styles.radioIndicator}>
              <div className={styles.radioInner}></div>
            </div>
          </label>
        ))}
      </div>

      {selectedType === 'delivery' && (
        <div className={styles.deliveryInfo}>
          <div className={styles.deliveryNote}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <strong>Время доставки:</strong> 25-35 минут<br />
              <strong>Зона доставки:</strong> Усть-Каменогорск
            </div>
          </div>
        </div>
      )}

      {selectedType === 'pickup' && (
        <div className={styles.pickupInfo}>
          <div className={styles.pickupNote}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M21 10C21 7 18.5 5 16 5C13.5 5 11 7 11 10C11 13 16 21 16 21S21 13 21 10Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M16 8.5C16.8284 8.5 17.5 7.82843 17.5 7C17.5 6.17157 16.8284 5.5 16 5.5C15.1716 5.5 14.5 6.17157 14.5 7C14.5 7.82843 15.1716 8.5 16 8.5Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <strong>Адрес ресторана:</strong><br />
              г. Усть-Каменогорск, ул. Протозанова, 125<br />
              <strong>Время готовности:</strong> 15-20 минут
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliverySelector
