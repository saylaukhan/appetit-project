import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Search } from 'lucide-react'
import { menuAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import AddAddonModal from './AddAddonModal'
import styles from './AddonsManagement.module.css'

const AddonsManagement = () => {
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAddon, setEditingAddon] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadAddons()
  }, [])

  const loadAddons = async () => {
    setLoading(true)
    try {
      const response = await menuAPI.getAddons({ show_all: true })
      const addonsList = response.data
      setAddons(addonsList)
      
      // Извлекаем уникальные категории
      const uniqueCategories = [...new Set(addonsList.map(addon => addon.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Ошибка загрузки добавок:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAddon = () => {
    setEditingAddon(null)
    setShowModal(true)
  }

  const handleEditAddon = (addon) => {
    setEditingAddon(addon)
    setShowModal(true)
  }

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту добавку?')) {
      return
    }

    try {
      await menuAPI.deleteAddon(addonId)
      setAddons(prev => prev.filter(addon => addon.id !== addonId))
    } catch (error) {
      console.error('Ошибка удаления добавки:', error)
      alert('Не удалось удалить добавку')
    }
  }

  const handleToggleActive = async (addonId) => {
    try {
      const response = await menuAPI.toggleAddonActive(addonId)
      setAddons(prev => prev.map(addon => 
        addon.id === addonId 
          ? { ...addon, is_active: response.data.is_active }
          : addon
      ))
    } catch (error) {
      console.error('Ошибка изменения статуса добавки:', error)
      alert('Не удалось изменить статус добавки')
    }
  }

  const handleAddonSaved = (savedAddon) => {
    if (editingAddon) {
      // Обновление существующей добавки
      setAddons(prev => prev.map(addon => 
        addon.id === savedAddon.id ? savedAddon : addon
      ))
    } else {
      // Добавление новой добавки
      setAddons(prev => [...prev, savedAddon])
    }
    
    // Обновляем список категорий если добавилась новая
    if (savedAddon.category && !categories.includes(savedAddon.category)) {
      setCategories(prev => [...prev, savedAddon.category])
    }
    
    setShowModal(false)
    setEditingAddon(null)
  }

  // Фильтрация добавок
  const filteredAddons = addons.filter(addon => {
    const matchesSearch = addon.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || addon.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Группировка по категориям
  const groupedAddons = filteredAddons.reduce((groups, addon) => {
    const category = addon.category || 'Без категории'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(addon)
    return groups
  }, {})

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление добавками</h1>
        <button 
          className={styles.addButton}
          onClick={handleCreateAddon}
        >
          <Plus size={20} />
          Добавить добавку
        </button>
      </div>

      {/* Фильтры */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск добавок..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.categoryFilter}
        >
          <option value="">Все категории</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
          <option value="">Без категории</option>
        </select>
      </div>

      {/* Статистика */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{addons.length}</span>
          <span className={styles.statLabel}>Всего добавок</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {addons.filter(addon => addon.is_active).length}
          </span>
          <span className={styles.statLabel}>Активных</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{categories.length}</span>
          <span className={styles.statLabel}>Категорий</span>
        </div>
      </div>

      {/* Список добавок по категориям */}
      <div className={styles.content}>
        {Object.keys(groupedAddons).length === 0 ? (
          <div className={styles.emptyState}>
            <p>Добавки не найдены</p>
            <button 
              className={styles.addButton}
              onClick={handleCreateAddon}
            >
              <Plus size={20} />
              Создать первую добавку
            </button>
          </div>
        ) : (
          Object.entries(groupedAddons).map(([category, categoryAddons]) => (
            <div key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category}</h2>
              
              <div className={styles.addonsGrid}>
                {categoryAddons.map(addon => (
                  <div 
                    key={addon.id} 
                    className={`${styles.addonCard} ${!addon.is_active ? styles.inactive : ''}`}
                  >
                    <div className={styles.addonIcon}>
                      <div className={styles.iconPlaceholder}>
                        +
                      </div>
                      <div className={styles.statusBadge}>
                        {addon.is_active ? (
                          <Eye size={16} className={styles.activeIcon} />
                        ) : (
                          <EyeOff size={16} className={styles.inactiveIcon} />
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.addonInfo}>
                      <h3 className={styles.addonName}>{addon.name}</h3>
                      <p className={styles.addonPrice}>{addon.price}₸</p>
                      {addon.category && (
                        <span className={styles.categoryTag}>{addon.category}</span>
                      )}
                    </div>
                    
                    <div className={styles.addonActions}>
                      <button
                        onClick={() => handleToggleActive(addon.id)}
                        className={`${styles.actionButton} ${addon.is_active ? styles.deactivateButton : styles.activateButton}`}
                        title={addon.is_active ? 'Деактивировать' : 'Активировать'}
                      >
                        {addon.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      
                      <button
                        onClick={() => handleEditAddon(addon)}
                        className={`${styles.actionButton} ${styles.editButton}`}
                        title="Редактировать"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAddon(addon.id)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно для создания/редактирования добавки */}
      <AddAddonModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingAddon(null)
        }}
        onAddonSaved={handleAddonSaved}
        editingAddon={editingAddon}
        existingCategories={categories}
      />
    </div>
  )
}

export default AddonsManagement
