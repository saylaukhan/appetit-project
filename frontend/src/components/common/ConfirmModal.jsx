import React from 'react'
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import styles from './ConfirmModal.module.css'

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'default', // 'default', 'danger', 'success', 'warning'
  isLoading = false,
  showActions = true
}) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle size={24} className={styles.dangerIcon} />
      case 'success':
        return <CheckCircle size={24} className={styles.successIcon} />
      case 'warning':
        return <AlertTriangle size={24} className={styles.warningIcon} />
      default:
        return <Info size={24} className={styles.defaultIcon} />
    }
  }

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return styles.dangerButton
      case 'success':
        return styles.successButton
      case 'warning':
        return styles.warningButton
      default:
        return styles.defaultButton
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            {getIcon()}
            <h3 className={styles.title}>{title}</h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {typeof message === 'string' ? (
            <p className={styles.message}>{message}</p>
          ) : (
            <div className={styles.customContent}>{message}</div>
          )}
        </div>

        {showActions && (
          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              className={`${styles.confirmButton} ${getConfirmButtonClass()}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  Загрузка...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConfirmModal