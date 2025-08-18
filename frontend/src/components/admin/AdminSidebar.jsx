import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  ChefHat,
  Truck,
  Settings,
  Tag,
  TrendingUp,
  LogOut,
  Home
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import styles from './AdminSidebar.module.css'

function AdminSidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    {
      path: '/admin',
      icon: <BarChart3 />,
      label: 'Дашборд',
      exact: true
    },
    {
      path: '/admin/orders',
      icon: <ShoppingBag />,
      label: 'Заказы'
    },
    {
      path: '/admin/menu',
      icon: <ChefHat />,
      label: 'Меню'
    },
    {
      path: '/admin/users',
      icon: <Users />,
      label: 'Пользователи'
    },
    {
      path: '/admin/analytics',
      icon: <TrendingUp />,
      label: 'Аналитика'
    },
    {
      path: '/admin/marketing',
      icon: <Tag />,
      label: 'Маркетинг'
    },
    {
      path: '/admin/settings',
      icon: <Settings />,
      label: 'Настройки'
    }
  ]

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className={styles.sidebarContainer}>
      {/* Логотип и заголовок */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          <img src="/assets/Logo APPETIT.png" alt="APPETIT" />
          <span>APPETIT</span>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>{user?.name || 'Администратор'}</div>
            <div className={styles.userRole}>Администратор</div>
          </div>
        </div>
      </div>

      {/* Навигационное меню */}
      <nav className={styles.sidebarNav}>
        <ul className={styles.navList}>
          {menuItems.map((item) => (
            <li key={item.path} className={styles.navItem}>
              <Link
                to={item.path}
                className={`${styles.navLink} ${
                  isActive(item.path, item.exact) ? styles.active : ''
                }`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Нижняя секция */}
      <div className={styles.sidebarFooter}>
        <Link to="/" className={styles.backToSite}>
          <Home />
          <span>На сайт</span>
        </Link>
        
        <button onClick={handleLogout} className={styles.logoutButton}>
          <LogOut />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar
