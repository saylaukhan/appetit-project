import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../services/api'

// Создаем глобальные слушатели для обновления уведомлений
let notificationListeners = []

export const addNotificationListener = (listener) => {
  notificationListeners.push(listener)
}

export const removeNotificationListener = (listener) => {
  notificationListeners = notificationListeners.filter(l => l !== listener)
}

export const triggerNotificationUpdate = () => {
  notificationListeners.forEach(listener => listener())
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState({
    pending_orders: 0,
    new_users: 0,
    notifications: []
  })
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await adminAPI.getNotifications()
      setNotifications(response.data)
    } catch (error) {
      console.error('Ошибка при загрузке уведомлений:', error)
      setNotifications({
        pending_orders: 0,
        new_users: 0,
        notifications: []
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    
    // Добавляем слушатель для принудительного обновления
    addNotificationListener(fetchNotifications)
    
    // Обновляем уведомления каждые 30 секунд
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => {
      clearInterval(interval)
      removeNotificationListener(fetchNotifications)
    }
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    refetch: fetchNotifications
  }
}