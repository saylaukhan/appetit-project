import React from 'react'
import { useCart } from '../../contexts/CartContext'
import styles from './CartItem.module.css'

function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart()

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1)
    } else {
      removeItem(item.id)
    }
  }

  const handleRemove = () => {
    removeItem(item.id)
  }

  const formatModifiers = () => {
    if (!item.modifiers || item.modifiers.length === 0) return null
    
    return item.modifiers.map(modifier => modifier.name).join(', ')
  }

  const formatAddons = () => {
    if (!item.addons || item.addons.length === 0) return null
    
    return item.addons.map(addon => `${addon.name} (+${addon.price} ₸)`).join(', ')
  }

  return (
    <div className={styles.cartItem}>
      <div className={styles.itemImage}>
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path 
                d="M3 3H21L19 13H5L3 3ZM3 3C2.4 3 2 2.6 2 2" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <div className={styles.itemDetails}>
        <div className={styles.itemHeader}>
          <h4 className={styles.itemName}>{item.name}</h4>
          <button 
            className={styles.removeButton}
            onClick={handleRemove}
            title="Удалить товар"
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

        {(item.modifiers?.length > 0 || item.addons?.length > 0) && (
          <div className={styles.itemOptions}>
            {formatModifiers() && (
              <div className={styles.modifiers}>
                <span className={styles.optionLabel}>Вариант:</span>
                <span>{formatModifiers()}</span>
              </div>
            )}
            {formatAddons() && (
              <div className={styles.addons}>
                <span className={styles.optionLabel}>Добавки:</span>
                <span>{formatAddons()}</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.itemFooter}>
          <div className={styles.quantityControls}>
            <button 
              className={styles.quantityButton}
              onClick={handleDecrement}
              disabled={item.quantity <= 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M5 12H19" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            <span className={styles.quantity}>{item.quantity}</span>
            
            <button 
              className={styles.quantityButton}
              onClick={handleIncrement}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 5V19M5 12H19" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.priceInfo}>
            {item.price !== item.basePrice && (
              <span className={styles.unitPrice}>{item.price} ₸ за шт.</span>
            )}
            <span className={styles.totalPrice}>{item.price * item.quantity} ₸</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartItem
