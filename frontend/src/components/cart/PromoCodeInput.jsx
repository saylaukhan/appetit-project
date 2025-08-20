import React, { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import styles from './PromoCodeInput.module.css'

function PromoCodeInput() {
  const { promoCode, applyPromoCode, removePromoCode } = useCart()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputValue.trim()) {
      setError('Введите промокод')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const success = await applyPromoCode(inputValue.trim().toUpperCase())
      
      if (success) {
        setInputValue('')
      }
    } catch (err) {
      setError('Ошибка при применении промокода')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = () => {
    removePromoCode()
    setInputValue('')
    setError('')
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    if (error) setError('')
  }

  if (promoCode) {
    return (
      <div className={styles.promoContainer}>
        <div className={styles.appliedPromo}>
          <div className={styles.promoInfo}>
            <div className={styles.promoIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <span className={styles.promoLabel}>Промокод применен:</span>
              <span className={styles.promoCodeText}>{promoCode}</span>
            </div>
          </div>
          <button 
            className={styles.removePromoButton}
            onClick={handleRemove}
            title="Отменить промокод"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.promoContainer}>
      <form className={styles.promoForm} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Введите промокод"
            className={`${styles.promoInput} ${error ? styles.error : ''}`}
            disabled={isLoading}
          />
          <button 
            type="submit"
            className={styles.applyButton}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              'Применить'
            )}
          </button>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>

      <div className={styles.promoHint}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path 
            d="M21 8.5C21 5.5 18.5 3 15.5 3C13.1 3 11.1 4.4 10.5 6.3C10.4 6.2 10.3 6.1 10.2 6.1C9.5 6.1 8.9 6.7 8.9 7.4C8.9 8.1 9.5 8.7 10.2 8.7H20C20.6 8.7 21 8.3 21 7.7C21 8.1 21 8.3 21 8.5ZM6 10H20V18C20 19.1 19.1 20 18 20H8C6.9 20 6 19.1 6 18V10Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span>Есть промокод? Получите дополнительную скидку!</span>
      </div>
    </div>
  )
}

export default PromoCodeInput
