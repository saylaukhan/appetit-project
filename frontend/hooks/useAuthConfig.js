import { useState, useEffect } from 'react'
import api from '../services/api'

/**
 * Хук для получения конфигурации авторизации с сервера
 */
export const useAuthConfig = () => {
  const [config, setConfig] = useState({
    telegram_bot_username: 'AppetitAuthBot', // fallback
    telegram_enabled: true,
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/api/v1/auth/config')
        setConfig({
          ...response.data,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Ошибка загрузки конфигурации авторизации:', error)
        setConfig(prev => ({
          ...prev,
          loading: false,
          error: 'Не удалось загрузить настройки авторизации'
        }))
      }
    }

    fetchConfig()
  }, [])

  return config
}

export default useAuthConfig
