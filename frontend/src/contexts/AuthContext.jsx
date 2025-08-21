import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

const AuthContext = createContext()

// Состояние аутентификации
const initialState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
}

// Reducer для управления состоянием
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      }
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('auth_user')

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, user: parsedUser }
        })
        
        // Установка токена в api по умолчанию (axios interceptor уже настроен)
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
    
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  // Вход по номеру телефона
  const login = async (phone, password) => {
    try {
      dispatch({ type: 'LOGIN_START' })

      const response = await api.post('/api/v1/auth/login', {
        phone,
        password
      })

      const { access_token, user } = response.data

      // Сохранение в localStorage
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('auth_user', JSON.stringify(user))

      // Токен устанавливается автоматически через interceptor

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token: access_token, user }
      })

      toast.success('Добро пожаловать!')
      return true
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR' })
      const message = error.response?.data?.detail || 'Ошибка входа в систему'
      toast.error(message)
      return false
    }
  }

  // Регистрация по номеру телефона
  const register = async (phone, name, password) => {
    try {
      dispatch({ type: 'LOGIN_START' })

      const response = await api.post('/api/v1/auth/register', {
        phone,
        name,
        password
      })

      const { access_token, user } = response.data

      // Сохранение в localStorage
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('auth_user', JSON.stringify(user))

      // Токен устанавливается автоматически через interceptor

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token: access_token, user }
      })

      toast.success('Регистрация успешна!')
      return true
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR' })
      const message = error.response?.data?.detail || 'Ошибка регистрации'
      toast.error(message)
      return false
    }
  }



  // Авторизация через Telegram
  const telegramAuth = async (telegramData) => {
    try {
      dispatch({ type: 'LOGIN_START' })

      const response = await api.post('/api/v1/auth/telegram', telegramData)

      const { access_token, user } = response.data

      // Сохранение в localStorage
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('auth_user', JSON.stringify(user))

      // Токен устанавливается автоматически через interceptor

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token: access_token, user }
      })

      toast.success('Добро пожаловать!')
      return true
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR' })
      const message = error.response?.data?.detail || 'Ошибка авторизации через Telegram'
      toast.error(message)
      return false
    }
  }

  // Выход из системы
  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    
    // Токен будет удален автоматически из localStorage, interceptor обработает это
    
    dispatch({ type: 'LOGOUT' })
    toast.success('До свидания!')
  }

  // Обновление данных пользователя
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData }
    localStorage.setItem('auth_user', JSON.stringify(updatedUser))
    
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    })
  }

  // Проверка роли пользователя
  const hasRole = (role) => {
    return state.user?.role === role
  }

  // Проверка прав доступа
  const hasPermission = (roles) => {
    if (!state.user?.role) return false
    return roles.includes(state.user.role)
  }

  const value = {
    ...state,
    login,
    register,
    telegramAuth,
    logout,
    updateUser,
    hasRole,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}