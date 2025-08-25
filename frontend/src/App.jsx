import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import styles from './App.module.css'

// Провайдеры контекстов
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Компоненты макета
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Клиентские страницы
import HomePage from './pages/client/HomePage'
import MenuPage from './pages/client/MenuPage'
import DishPage from './pages/client/DishPage'
import CartPage from './pages/client/CartPage'
import CheckoutPage from './pages/client/CheckoutPage'
import ProfilePage from './pages/client/ProfilePage'
import LoginPage from './pages/client/LoginPage'
import OrderTrackingPage from './pages/client/OrderTrackingPage'

// Административные страницы
import AdminDashboard from './pages/admin/Dashboard'
import MenuManagement from './pages/admin/MenuManagement'
import OrderManagement from './pages/admin/OrderManagement'
import UserManagement from './pages/admin/UserManagement'
import AnalyticsPage from './pages/admin/Analytics'
import MarketingPage from './pages/admin/MarketingPage'

import AdminSidebar from './components/admin/AdminSidebar'

// Интерфейс кухни
import KitchenDashboard from './pages/kitchen/KitchenDashboard'

// Интерфейс курьера
import CourierDashboard from './pages/courier/CourierDashboard'
import DeliveryPage from './pages/courier/DeliveryPage'

// Вспомогательные компоненты
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <div className={styles.appContainer}>
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={<ClientLayout />} />
              <Route path="/about" element={<ClientLayout />} />
              <Route path="/menu" element={<ClientLayout />} />
              <Route path="/menu/:categoryId" element={<ClientLayout />} />
              <Route path="/dish/:dishId" element={<ClientLayout />} />
              <Route path="/cart" element={<ClientLayout />} />
              <Route path="/checkout" element={<ClientLayout />} />
              <Route path="/login" element={<ClientLayout />} />
              <Route path="/profile" element={
                <ProtectedRoute roles={['client']}>
                  <ClientLayout />
                </ProtectedRoute>
              } />
              <Route path="/order/:orderId" element={
                <ProtectedRoute roles={['client']}>
                  <ClientLayout />
                </ProtectedRoute>
              } />

              {/* Административные маршруты */}
              <Route path="/admin/*" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              } />

              {/* Интерфейс кухни */}
              <Route path="/kitchen" element={
                <ProtectedRoute roles={['kitchen']}>
                  <KitchenDashboard />
                </ProtectedRoute>
              } />

              {/* Интерфейс курьера */}
              <Route path="/courier/*" element={
                <ProtectedRoute roles={['courier']}>
                  <CourierLayout />
                </ProtectedRoute>
              } />

              {/* 404 страница */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

// Макет для клиентской части
function ClientLayout() {
  const location = useLocation()
  
  const getPageComponent = () => {
    const path = location.pathname
    if (path === '/') return <MenuPage />
    if (path === '/about') return <HomePage />
    if (path === '/menu' || path.startsWith('/menu/')) return <MenuPage />
    if (path.startsWith('/dish/')) return <DishPage />
    if (path === '/cart') return <CartPage />
    if (path === '/checkout') return <CheckoutPage />
    if (path === '/login') return <LoginPage />
    if (path === '/profile') return <ProfilePage />
    if (path.startsWith('/order/')) return <OrderTrackingPage />
    return <MenuPage />
  }

  return (
    <>
      <Header />
      <main className={styles.mainContent}>
        {getPageComponent()}
      </main>
      <Footer />
    </>
  )
}

// Макет для административной панели
function AdminLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const getAdminPage = () => {
    const path = location.pathname
    if (path === '/admin') return <AdminDashboard />
    if (path === '/admin/orders') return <OrderManagement />
    if (path === '/admin/menu') return <MenuManagement />
    if (path === '/admin/users') return <UserManagement />
    if (path === '/admin/analytics') return <AnalyticsPage />
    if (path === '/admin/marketing') return <MarketingPage />
    return <AdminDashboard />
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className={styles.adminContainer}>
      {/* Кнопка гамбургер-меню */}
      <button 
        className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleHidden : ''}`}
        onClick={toggleSidebar}
        aria-label="Открыть меню"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop для закрытия sidebar при клике */}
      {sidebarOpen && (
        <div 
          className={styles.sidebarBackdrop}
          onClick={closeSidebar}
        />
      )}

      <main className={styles.adminMain}>
        {getAdminPage()}
      </main>
      
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
      />
    </div>
  )
}

// Макет для курьера
function CourierLayout() {
  return (
    <div className={styles.mobileContainer}>
      <CourierDashboard />
    </div>
  )
}

export default App