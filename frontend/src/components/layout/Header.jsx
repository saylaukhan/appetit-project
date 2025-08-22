import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, Search, X, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { RoleGuard, useRole } from '../common/ProtectedRoute'
import styles from './Header.module.css'

function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const { user, isAuthenticated, logout } = useAuth()
  const { itemsCount } = useCart()
  const { userRole, isAdmin, isKitchen, isCourier } = useRole()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleUserClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu)
    } else {
      navigate('/login')
    }
  }

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const goToUserDashboard = () => {
    setShowUserMenu(false)
    
    if (isAdmin()) {
      navigate('/admin')
    } else if (isKitchen()) {
      navigate('/kitchen')
    } else if (isCourier()) {
      navigate('/courier')
    } else {
      navigate('/profile')
    }
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Администратор'
      case 'kitchen': return 'Кухня'
      case 'courier': return 'Курьер' 
      case 'client': return 'Клиент'
      default: return role
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <img src="/src/assets/Logo MAIN.png" alt="APPETIT" />
          </Link>

          <nav className={styles.navigation}>
            <Link to="/" className={styles.navLink}>Главная</Link>
            <Link to="/menu" className={styles.navLink}>Меню</Link>
            <Link to="/about" className={styles.navLink}>О нас</Link>
            <Link to="/contacts" className={styles.navLink}>Контакты</Link>
          </nav>

          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Поиск блюд..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.actions}>
            <RoleGuard roles={['client']}>
              <Link to="/cart" className={styles.cartButton}>
                <ShoppingCart size={18} />
                <span>Корзина</span>
                {itemsCount > 0 && (
                  <span className={styles.cartBadge}>{itemsCount}</span>
                )}
              </Link>
            </RoleGuard>

            <div className={styles.userMenuContainer}>
              <button onClick={handleUserClick} className={styles.userButton}>
                <User size={18} />
                <span>
                  {isAuthenticated ? user?.name || 'Профиль' : 'Войти'}
                </span>
                {isAuthenticated && userRole && (
                  <span className={styles.userRole}>
                    {getRoleDisplayName(userRole)}
                  </span>
                )}
              </button>

              {isAuthenticated && showUserMenu && (
                <div className={styles.userDropdown}>
                  <button onClick={goToUserDashboard} className={styles.dropdownItem}>
                    <Settings size={16} />
                    {isAdmin() ? 'Админ панель' : isKitchen() ? 'Кухня' : isCourier() ? 'Заказы' : 'Профиль'}
                  </button>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    <LogOut size={16} />
                    Выйти
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className={styles.mobileMenuButton}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <Link to="/" onClick={closeMobileMenu} className={styles.logo}>
            <img src="/src/assets/Logo APPETIT.png" alt="APPETIT" />
          </Link>
          <button onClick={closeMobileMenu}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.mobileMenuNav}>
          <Link to="/" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            Главная
          </Link>
          <Link to="/menu" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            Меню
          </Link>
          <Link to="/about" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            О нас
          </Link>
          <Link to="/contacts" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            Контакты
          </Link>
          <Link to="/cart" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            Корзина ({itemsCount})
          </Link>
          <Link 
            to={isAuthenticated ? "/profile" : "/login"} 
            onClick={closeMobileMenu}
            className={styles.mobileNavLink}
          >
            {isAuthenticated ? 'Профиль' : 'Войти'}
          </Link>
        </nav>
      </div>
    </>
  )
}

export default Header