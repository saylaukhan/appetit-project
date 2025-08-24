import React, { useEffect } from 'react'
import { X, MapPin, Clock, Phone } from 'lucide-react'
import styles from './ContactsModal.module.css'

function ContactsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      console.log('Modal is opening') // Для отладки
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  console.log('Modal render, isOpen:', isOpen) // Для отладки

  if (!isOpen) return null

  const contacts = [
    {
      address: 'КАЗАХСТАН, 70А',
      hours: 'Ежедневно: с 12:00 до 23:00',
      phone: null
    },
    {
      address: 'САТПАЕВА, 8А',
      hours: 'Ежедневно: с 00:00 до 00:00',
      phone: null
    },
    {
      address: 'НОВАТОРОВ, 18/2',
      hours: 'Ежедневно: с 00:00 до 00:00',
      phone: '+77772347883'
    },
    {
      address: 'ЖИБЕК ЖОЛЫ, 1к8',
      hours: 'Ежедневно: с 11:00 до 02:00',
      phone: null
    },
    {
      address: 'САМАРСКОЕ ШОССЕ, 5/1',
      hours: 'Ежедневно: с 10:00 до 23:00',
      phone: null
    },
    {
      address: 'НАЗАРБАЕВА, 28А',
      hours: 'Ежедневно: с 10:00 до 00:00',
      phone: null
    }
  ]

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Номера и адреса</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.contactsList}>
          {contacts.map((contact, index) => (
            <div key={index} className={styles.contactItem}>
              <div className={styles.contactInfo}>
                <div className={styles.addressRow}>
                  <MapPin size={16} className={styles.icon} />
                  <span className={styles.address}>{contact.address}</span>
                </div>
                
                <div className={styles.hoursRow}>
                  <Clock size={16} className={styles.icon} />
                  <span className={styles.hours}>{contact.hours}</span>
                </div>
                
                {contact.phone && (
                  <div className={styles.phoneRow}>
                    <Phone size={16} className={styles.icon} />
                    <a href={`tel:${contact.phone}`} className={styles.phone}>
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContactsModal