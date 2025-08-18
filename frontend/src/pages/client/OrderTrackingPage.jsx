import React from 'react'
import styles from './OrderTrackingPage.module.css'

function OrderTrackingPage() {
  return (
    <div className={styles.trackingContainer}>
      <div className="container">
        <h1>Отслеживание заказа</h1>
        <p>Информация о статусе заказа и курьере</p>
      </div>
    </div>
  )
}

export default OrderTrackingPage