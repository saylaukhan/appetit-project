import React from 'react'
import styles from './NotificationBadge.module.css'

function NotificationBadge({ count = 0, children }) {
  if (count === 0) {
    return children
  }

  return (
    <div className={styles.container}>
      {children}
      <span className={styles.badge}>
        {count > 99 ? '99+' : count}
      </span>
    </div>
  )
}

export default NotificationBadge