import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import styles from './ProtectedRoute.module.css'

function ProtectedRoute({ children, roles = [], redirectTo = '/login' }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  // Показываем спиннер во время проверки аутентификации
  if (loading) {
    return <LoadingSpinner fullScreen text="Проверяем доступ..." />
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Если указаны роли для проверки
  if (roles.length > 0) {
    // Проверяем, есть ли у пользователя нужная роль
    const userRole = user?.role?.toLowerCase()
    const allowedRoles = roles.map(role => role.toLowerCase())
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Показываем сообщение об ошибке доступа и перенаправляем на соответствующую страницу
      return <AccessDenied userRole={userRole} requiredRoles={allowedRoles} />
    }
  }

  return children
}

// Вспомогательная функция для определения маршрута по умолчанию для роли
function getDefaultRouteForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'kitchen':
      return '/kitchen'
    case 'courier':
      return '/courier'
    case 'client':
      return '/'
    default:
      return '/'
  }
}

// Компонент для отображения сообщения о недостаточных правах
export function AccessDenied({ userRole, requiredRoles }) {
  const { logout } = useAuth()
  
  return (
    <div className={styles.accessDenied}>
      <div className={styles.accessDeniedCard}>
        <div className={styles.icon}>🔒</div>
        <h2>Доступ ограничен</h2>
        <p>
          Ваша роль: <strong>{getRoleDisplayName(userRole)}</strong>
        </p>
        <p>
          Требуется роль: <strong>{requiredRoles.map(getRoleDisplayName).join(', ')}</strong>
        </p>
        <div className={styles.actions}>
          <button 
            onClick={() => window.history.back()}
            className={styles.backButton}
          >
            ← Назад
          </button>
          <button 
            onClick={logout}
            className={styles.logoutButton}
          >
            Сменить пользователя
          </button>
        </div>
      </div>
    </div>
  )
}

// Функция для получения отображаемого имени роли
function getRoleDisplayName(role) {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'Администратор'
    case 'kitchen':
      return 'Кухня'
    case 'courier':
      return 'Курьер'
    case 'client':
      return 'Клиент'
    default:
      return role || 'Неизвестно'
  }
}

// Хук для проверки роли пользователя
export function useRole() {
  const { user } = useAuth()
  
  const hasRole = (role) => {
    return user?.role?.toLowerCase() === role.toLowerCase()
  }
  
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role))
  }
  
  const isAdmin = () => hasRole('admin')
  const isKitchen = () => hasRole('kitchen')
  const isCourier = () => hasRole('courier')
  const isClient = () => hasRole('client')
  
  return {
    userRole: user?.role?.toLowerCase(),
    hasRole,
    hasAnyRole,
    isAdmin,
    isKitchen,
    isCourier,
    isClient
  }
}

// Компонент для условного рендеринга на основе роли
export function RoleGuard({ roles, children, fallback = null, show = true }) {
  const { hasAnyRole } = useRole()
  
  if (!roles || roles.length === 0) {
    return show ? children : fallback
  }
  
  const hasAccess = hasAnyRole(roles)
  
  if (show) {
    return hasAccess ? children : fallback
  } else {
    return hasAccess ? fallback : children
  }
}

export default ProtectedRoute