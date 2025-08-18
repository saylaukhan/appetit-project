import React from 'react'
import styles from './CartPage.module.css'

function CartPage() {
  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartContent}>
        <h1>Корзина</h1>
        <p>Ваша корзина пока пуста</p>
      </div>
    </div>
  )
}

export default CartPage