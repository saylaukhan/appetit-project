import React from 'react'
import styles from './ProfilePage.module.css'

function ProfilePage() {
  return (
    <div className={styles.profileContainer}>
      <div className="container">
        <h1>Личный кабинет</h1>
        <p>Профиль пользователя и история заказов</p>
      </div>
    </div>
  )
}

export default ProfilePage