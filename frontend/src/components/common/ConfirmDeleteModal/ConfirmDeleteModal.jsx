import React from 'react'
import styles from './ConfirmDeleteModal.module.css'

function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Подтверждение удаления",
  message = "Вы действительно хотите удалить этот элемент?",
  confirmText = "Удалить",
  cancelText = "Отмена",
  isLoading = false 
}) {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose}
            disabled={isLoading}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.iconContainer}>
            <div className={styles.warningIcon}>
              ⚠️
            </div>
          </div>
          
          <div className={styles.messageContainer}>
            <p className={styles.message}>{message}</p>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Удаление...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
