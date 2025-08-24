import api from './api'

class UserService {
  // Получение списка пользователей с пагинацией, поиском и фильтрацией
  async getUsers(page = 1, perPage = 20, search = '', role = '', isActive = null) {
    try {
      console.log('🔍 UserService: Запрос пользователей', { page, perPage, search, role, isActive })
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      })
      
      if (search?.trim()) {
        params.append('search', search.trim())
      }

      if (role?.trim()) {
        params.append('role', role.trim())
      }

      if (isActive !== null) {
        params.append('is_active', isActive.toString())
      }

      console.log('📡 UserService: URL запроса:', `/api/v1/users?${params}`)
      const response = await api.get(`/api/v1/users?${params}`)
      console.log('✅ UserService: Ответ получен:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ UserService: Ошибка запроса пользователей:', error)
      console.error('❌ UserService: Детали ошибки:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      throw error
    }
  }

  // Получение информации о конкретном пользователе
  async getUser(userId) {
    const response = await api.get(`/api/v1/users/${userId}`)
    return response.data
  }

  // Изменение роли пользователя
  async updateUserRole(userId, role) {
    const response = await api.put(`/api/v1/users/${userId}/role`, { role })
    return response.data
  }

  // Изменение статуса активности пользователя
  async updateUserStatus(userId, isActive) {
    const response = await api.put(`/api/v1/users/${userId}/status`, { is_active: isActive })
    return response.data
  }

  // Получение статистики пользователей
  async getUsersStats() {
    try {
      // Получаем первую страницу для общей статистики
      const data = await this.getUsers(1, 1)
      return {
        total: data.total,
        totalPages: data.total_pages
      }
    } catch (error) {
      console.error('Error fetching users stats:', error)
      throw error
    }
  }
}

export default new UserService()