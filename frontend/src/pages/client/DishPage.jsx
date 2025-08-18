import React from 'react'
import styles from './DishPage.module.css'

function DishPage() {
  return (
    <div className={styles.dishContainer}>
      <div className={styles.dishContent}>
        <h1>Страница блюда</h1>
        <p>Детальная информация о блюде будет здесь</p>
      </div>
    </div>
  )
}

export default DishPage