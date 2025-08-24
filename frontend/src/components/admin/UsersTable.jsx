import React, { useState, useEffect } from 'react'
import { 
  Users, Search, Filter, Edit3, UserCheck, UserX, Shield, 
  Phone, Mail, MapPin, Calendar, Package, Eye, MoreVertical,
  ChevronLeft, ChevronRight, RefreshCw, X
} from 'lucide-react'
import userService from '../../services/userService'
import Toast from '../common/Toast'
import ConfirmModal from '../common/ConfirmModal'
import styles from './UsersTable.module.css'

const ROLES = {
  client: { label: 'Клиент', color: '#10b981', icon: Users },
  admin: { label: 'Администратор', color: '#dc2626', icon: Shield },
  kitchen: { label: 'Кухня', color: '#f59e0b', icon: UserCheck },
  courier: { label: 'Курьер', color: '#3b82f6', icon: UserX }
}

function UsersTable() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [perPage] = useState(15)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })

  // Загрузка пользователей
  const fetchUsers = async (page = currentPage, search = searchTerm, role = roleFilter, status = statusFilter) => {
    try {
      console.log('🚀 UsersTable: Начинаем загрузку пользователей', { page, search, role, status, perPage })
      setLoading(true)
      
      // Преобразуем статус в булево значение для API
      let isActiveFilter = null
      if (status === 'active') isActiveFilter = true
      if (status === 'inactive') isActiveFilter = false
      
      const data = await userService.getUsers(page, perPage, search, role, isActiveFilter)
      console.log('📦 UsersTable: Данные получены:', data)
      
      setUsers(data.users || [])
      setTotalPages(data.total_pages || 0)
      setTotalUsers(data.total || 0)
      setCurrentPage(data.page || 1)
      
      console.log('✅ UsersTable: Состояние обновлено:', {
        usersCount: data.users?.length || 0,
        totalUsers: data.total || 0,
        totalPages: data.total_pages || 0,
        currentPage: data.page || 1
      })
      
    } catch (error) {
      console.error('❌ UsersTable: Ошибка загрузки пользователей:', error)
      
      // Детальная информация об ошибке
      if (error.response) {
        console.error('❌ UsersTable: HTTP Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        })
        
        if (error.response.status === 401) {
          showToast('Необходимо войти в систему как администратор', 'error')
        } else if (error.response.status === 403) {
          showToast('Недостаточно прав для просмотра пользователей', 'error')
        } else {
          showToast(`Ошибка загрузки: ${error.response.status}`, 'error')
        }
      } else if (error.request) {
        console.error('❌ UsersTable: Network Error:', error.request)
        showToast('Ошибка сети. Проверьте подключение к серверу', 'error')
      } else {
        console.error('❌ UsersTable: Unknown Error:', error.message)
        showToast('Неизвестная ошибка загрузки пользователей', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Поиск и фильтры с debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, searchTerm, roleFilter, statusFilter)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, roleFilter, statusFilter])

  // Обработчик сброса фильтров
  const handleResetFilters = () => {
    setSearchTerm('')
    setRoleFilter('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  // Проверка активности фильтров
  const hasActiveFilters = searchTerm || roleFilter || statusFilter

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
  }

  const hideToast = () => {
    setToast({ isVisible: false, message: '', type: 'success' })
  }

  // Смена роли пользователя
  const handleRoleChange = async (newRole) => {
    if (!selectedUser) return

    try {
      setActionLoading('role')
      await userService.updateUserRole(selectedUser.id, newRole)
      
      // Обновляем пользователя в списке
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: newRole }
            : user
        )
      )
      
      showToast(`Роль пользователя изменена на "${ROLES[newRole].label}"`)
      setShowRoleModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user role:', error)
      showToast('Ошибка изменения роли', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // Смена статуса пользователя
  const handleStatusChange = async (isActive) => {
    if (!selectedUser) return

    try {
      setActionLoading('status')
      await userService.updateUserStatus(selectedUser.id, isActive)
      
      // Обновляем пользователя в списке
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, is_active: isActive }
            : user
        )
      )
      
      const action = isActive ? 'активирован' : 'деактивирован'
      showToast(`Пользователь ${action}`)
      setShowStatusModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user status:', error)
      showToast('Ошибка изменения статуса', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // Пагинация
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      fetchUsers(newPage, searchTerm, roleFilter, statusFilter)
    }
  }

  // Обновление списка
  const handleRefresh = () => {
    fetchUsers(currentPage, searchTerm, roleFilter, statusFilter)
  }

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Получение компонента роли
  const getRoleBadge = (role) => {
    const roleData = ROLES[role] || ROLES.client
    const IconComponent = roleData.icon
    
    return (
      <div 
        className={styles.roleBadge}
        style={{ backgroundColor: `${roleData.color}15`, color: roleData.color }}
      >
        <IconComponent size={14} />
        <span>{roleData.label}</span>
      </div>
    )
  }

  // Получение статуса активности
  const getStatusBadge = (isActive) => {
    return (
      <div 
        className={`${styles.statusBadge} ${isActive ? styles.active : styles.inactive}`}
      >
        {isActive ? <UserCheck size={14} /> : <UserX size={14} />}
        <span>{isActive ? 'Активен' : 'Неактивен'}</span>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Заголовок и статистика */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Управление пользователями</h1>
          <p>Всего пользователей: <strong>{totalUsers}</strong></p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            Обновить
          </button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className={styles.searchSection}>
        <div className={styles.searchFiltersContainer}>
          <div className={styles.searchBox}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Поиск по имени, телефону или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filtersContainer}>
            <div className={styles.filterBox}>
              <Filter size={16} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Все роли</option>
                <option value="client">Клиенты</option>
                <option value="admin">Администраторы</option>
                <option value="kitchen">Кухня</option>
                <option value="courier">Курьеры</option>
              </select>
            </div>

            <div className={styles.filterBox}>
              <UserCheck size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button 
                className={styles.resetButton}
                onClick={handleResetFilters}
                title="Сбросить фильтры"
              >
                <X size={16} />
                Сбросить
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFiltersInfo}>
            <span>Применены фильтры:</span>
            {searchTerm && <span className={styles.filterTag}>Поиск: "{searchTerm}"</span>}
            {roleFilter && <span className={styles.filterTag}>Роль: {ROLES[roleFilter]?.label}</span>}
            {statusFilter && <span className={styles.filterTag}>Статус: {statusFilter === 'active' ? 'Активные' : 'Неактивные'}</span>}
          </div>
        )}
      </div>

      {/* Таблица пользователей */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Загрузка пользователей...</p>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <h3>Пользователи не найдены</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Контакты</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Заказы</th>
                  <th>Регистрация</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                          <Users size={20} />
                        </div>
                        <div className={styles.userDetails}>
                          <div className={styles.userName}>{user.name}</div>
                          <div className={styles.userId}>ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        <div className={styles.contactItem}>
                          <Phone size={14} />
                          <span>{user.phone}</span>
                        </div>
                        {user.email && (
                          <div className={styles.contactItem}>
                            <Mail size={14} />
                            <span>{user.email}</span>
                          </div>
                        )}
                        {user.address && (
                          <div className={styles.contactItem}>
                            <MapPin size={14} />
                            <span>{user.address.substring(0, 30)}...</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getStatusBadge(user.is_active)}</td>
                    <td>
                      <div className={styles.ordersInfo}>
                        <div className={styles.ordersCount}>
                          <Package size={14} />
                          <span>{user.orders_count}</span>
                        </div>
                        {user.last_order_date && (
                          <div className={styles.lastOrder}>
                            Последний: {formatDate(user.last_order_date)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.registrationInfo}>
                        <Calendar size={14} />
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => {
                            setSelectedUser(user)
                            setShowRoleModal(true)
                          }}
                          title="Изменить роль"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => {
                            setSelectedUser(user)
                            setShowStatusModal(true)
                          }}
                          title="Изменить статус"
                        >
                          {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Предыдущая
                </button>
                
                <div className={styles.pageInfo}>
                  <span>
                    Страница {currentPage} из {totalPages}
                  </span>
                  <span className={styles.totalInfo}>
                    ({((currentPage - 1) * perPage + 1)}-{Math.min(currentPage * perPage, totalUsers)} из {totalUsers})
                  </span>
                </div>
                
                <button
                  className={styles.pageButton}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Следующая
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно смены роли */}
      {showRoleModal && selectedUser && (
        <ConfirmModal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false)
            setSelectedUser(null)
          }}
          title="Изменение роли пользователя"
          message={
            <div className={styles.roleChangeContent}>
              <p>Выберите новую роль для пользователя <strong>{selectedUser.name}</strong>:</p>
              <div className={styles.roleOptions}>
                {Object.entries(ROLES).map(([roleKey, roleData]) => {
                  const IconComponent = roleData.icon
                  return (
                    <button
                      key={roleKey}
                      className={`${styles.roleOption} ${
                        roleKey === selectedUser.role ? styles.currentRole : ''
                      }`}
                      onClick={() => handleRoleChange(roleKey)}
                      disabled={actionLoading === 'role' || roleKey === selectedUser.role}
                      style={{ borderColor: roleData.color }}
                    >
                      <IconComponent size={16} color={roleData.color} />
                      <span>{roleData.label}</span>
                      {roleKey === selectedUser.role && <span className={styles.currentBadge}>Текущая</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          }
          showActions={false}
          isLoading={actionLoading === 'role'}
        />
      )}

      {/* Модальное окно смены статуса */}
      {showStatusModal && selectedUser && (
        <ConfirmModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false)
            setSelectedUser(null)
          }}
          title={selectedUser.is_active ? 'Деактивация пользователя' : 'Активация пользователя'}
          message={
            selectedUser.is_active
              ? `Вы действительно хотите деактивировать пользователя ${selectedUser.name}? После деактивации пользователь не сможет войти в систему.`
              : `Вы действительно хотите активировать пользователя ${selectedUser.name}?`
          }
          confirmText={selectedUser.is_active ? 'Деактивировать' : 'Активировать'}
          cancelText="Отмена"
          onConfirm={() => handleStatusChange(!selectedUser.is_active)}
          isLoading={actionLoading === 'status'}
          type={selectedUser.is_active ? 'danger' : 'success'}
        />
      )}

      {/* Toast уведомления */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}

export default UsersTable