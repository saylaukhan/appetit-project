import React from 'react'
import styles from './MenuPage.module.css'

function MenuPage() {
  return (
    <div className={styles.menuContainer}>
      <div className={styles.menuContent}>
        <h1 className={styles.pageTitle}>Меню ресторана</h1>
        <div className={styles.comingSoon}>
          <h2>Скоро здесь будет полное меню!</h2>
          <p>Мы работаем над созданием удобного каталога блюд с возможностью заказа.</p>
        </div>
      </div>
    </div>
  )
}

export default MenuPage