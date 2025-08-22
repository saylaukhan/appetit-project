import { useState, useCallback } from 'react'

export const useAddress = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Получение адреса пользователя
  const getUserAddress = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Не найден токен авторизации')
      }

      const response = await fetch('http://localhost:8000/api/v1/users/me/address', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Ошибка получения адреса')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      console.error('Ошибка получения адреса:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Сохранение адреса пользователя
  const saveUserAddress = useCallback(async (addressData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Не найден токен авторизации')
      }

      const response = await fetch('http://localhost:8000/api/v1/users/me/address', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Ошибка сохранения адреса')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      console.error('Ошибка сохранения адреса:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Проверка наличия адреса у пользователя
  const checkUserAddress = useCallback(async () => {
    const addressData = await getUserAddress()
    return addressData?.has_address || false
  }, [getUserAddress])

  return {
    isLoading,
    error,
    getUserAddress,
    saveUserAddress,
    checkUserAddress
  }
}
