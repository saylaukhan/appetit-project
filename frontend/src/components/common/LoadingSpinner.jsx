import React from 'react'
import styles from './LoadingSpinner.module.css'

function LoadingSpinner({ 
  size = '40px', 
  text = 'Загрузка...', 
  fullScreen = false, 
  showText = true 
}) {
  return (
    <div className={`${styles.spinnerContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div>
        <div 
          className={styles.spinner}
          style={{ width: size, height: size }}
        />
        {showText && <p className={styles.loadingText}>{text}</p>}
      </div>
    </div>
  )
}

export default LoadingSpinner