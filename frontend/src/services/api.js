import axios from 'axios'
import { toast } from 'react-hot-toast'

// Базовая конфигурация API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor для добавления токена аутентификации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor для обработки ответов и ошибок
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Обработка ошибок аутентификации
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Обработка серверных ошибок
    if (error.response?.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.')
    }

    // Обработка ошибок сети
    if (!error.response) {
      toast.error('Проблемы с подключением к серверу')
    }

    return Promise.reject(error)
  }
)

// API методы для различных сущностей

// Аутентификация
export const authAPI = {
  login: (phone, password) => api.post('/api/v1/auth/login', { phone, password }),
  register: (phone, name, password) => api.post('/api/v1/auth/register', { phone, name, password }),
  requestSMS: (phone) => api.post('/api/v1/auth/request-sms', { phone }),
  verifySMS: (phone, code) => api.post('/api/v1/auth/verify-sms', { phone, code }),
  refreshToken: () => api.post('/api/v1/auth/refresh'),
  me: () => api.get('/api/v1/auth/me'),
}

// Меню и блюда
export const menuAPI = {
  getCategories: () => api.get('/api/v1/menu/categories'),
  getDishes: (params = {}) => api.get('/api/v1/menu/dishes', { params }),
  getDish: (dishId) => api.get(`/api/v1/menu/dishes/${dishId}`),
  searchDishes: (query) => api.get('/api/v1/menu/dishes/search', { params: { q: query } }),
  createDish: (dishData) => api.post('/api/v1/menu/dishes', dishData),
  updateDish: (dishId, dishData) => api.put(`/api/v1/menu/dishes/${dishId}`, dishData),
  deleteDish: (dishId) => api.delete(`/api/v1/menu/dishes/${dishId}`),
  toggleDishAvailability: (dishId) => api.patch(`/api/v1/menu/dishes/${dishId}/toggle-availability`),
  
  // Добавки
  getAddons: (params = {}) => api.get('/api/v1/menu/addons', { params }),
  getAddon: (addonId) => api.get(`/api/v1/menu/addons/${addonId}`),
  createAddon: (addonData) => api.post('/api/v1/menu/addons', addonData),
  updateAddon: (addonId, addonData) => api.put(`/api/v1/menu/addons/${addonId}`, addonData),
  deleteAddon: (addonId) => api.delete(`/api/v1/menu/addons/${addonId}`),
  toggleAddonActive: (addonId) => api.patch(`/api/v1/menu/addons/${addonId}/toggle-active`),
}

// Заказы
export const ordersAPI = {
  createOrder: (orderData) => api.post('/api/v1/orders', orderData),
  getOrders: (params = {}) => api.get('/api/v1/orders', { params }),
  getOrder: (orderId) => api.get(`/api/v1/orders/${orderId}`),
  updateOrderStatus: (orderId, status) => api.patch(`/api/v1/orders/${orderId}/status`, { status }),
  assignCourier: (orderId, courierId) => api.patch(`/api/v1/orders/${orderId}/assign`, { courier_id: courierId }),
}

// Промокоды
export const promoAPI = {
  validatePromo: (code) => api.post('/api/v1/promo-codes/validate', { code }),
  getPromos: () => api.get('/api/v1/promo-codes'),
  createPromo: (promoData) => api.post('/api/v1/promo-codes', promoData),
  updatePromo: (promoId, promoData) => api.put(`/api/v1/promo-codes/${promoId}`, promoData),
  deletePromo: (promoId) => api.delete(`/api/v1/promo-codes/${promoId}`),
}

// Пользователи
export const usersAPI = {
  getUsers: (params = {}) => api.get('/api/v1/users', { params }),
  getUser: (userId) => api.get(`/api/v1/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/api/v1/users/${userId}`, userData),
  updateProfile: (profileData) => api.put('/api/v1/users/me', profileData),
  changeRole: (userId, role) => api.patch(`/api/v1/users/${userId}/role`, { role }),
}

// Аналитика
export const analyticsAPI = {
  getDashboard: (params = {}) => api.get('/api/v1/analytics/dashboard', { params }),
  getOrderStats: (params = {}) => api.get('/api/v1/analytics/orders', { params }),
  getRevenueStats: (params = {}) => api.get('/api/v1/analytics/revenue', { params }),
  getCustomerStats: (params = {}) => api.get('/api/v1/analytics/customers', { params }),
  getUTMStats: (params = {}) => api.get('/api/v1/analytics/utm', { params }),
}

// Маркетинг
export const marketingAPI = {
  getBanners: () => api.get('/api/v1/marketing/banners'),
  createBanner: (bannerData) => api.post('/api/v1/marketing/banners', bannerData),
  updateBanner: (bannerId, bannerData) => api.put(`/api/v1/marketing/banners/${bannerId}`, bannerData),
  deleteBanner: (bannerId) => api.delete(`/api/v1/marketing/banners/${bannerId}`),
  sendPushNotification: (notificationData) => api.post('/api/v1/marketing/push', notificationData),
}

// Курьеры
export const courierAPI = {
  getAssignedOrders: () => api.get('/api/v1/courier/orders'),
  updateDeliveryStatus: (orderId, status, location = null) => 
    api.patch(`/api/v1/courier/orders/${orderId}/status`, { status, location }),
  getCouriers: () => api.get('/api/v1/couriers'),
  updateCourierLocation: (location) => api.patch('/api/v1/courier/location', location),
}

// Кухня
export const kitchenAPI = {
  getKitchenOrders: () => api.get('/api/v1/kitchen/orders'),
  updateOrderStatus: (orderId, status) => api.patch(`/api/v1/kitchen/orders/${orderId}/status`, { status }),
  markOrderReady: (orderId) => api.patch(`/api/v1/kitchen/orders/${orderId}/ready`),
}

// Файлы и изображения
export const filesAPI = {
  uploadImage: (file, folder = 'dishes') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    
    return api.post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  deleteImage: (imagePath) => api.delete(`/api/v1/files/${imagePath}`),
}

// Уведомления
export const notificationsAPI = {
  getNotifications: () => api.get('/api/v1/notifications'),
  markAsRead: (notificationId) => api.patch(`/api/v1/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/api/v1/notifications/read-all'),
  getUnreadCount: () => api.get('/api/v1/notifications/unread-count'),
}

export default api
