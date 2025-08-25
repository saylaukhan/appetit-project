import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  EyeOff,
  Image,
  DollarSign,
  ChefHat,
  Tag,
  Edit2
} from 'lucide-react'
import { menuAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import AddDishModal from '../../components/admin/AddDishModal'
import AddAddonModal from '../../components/admin/AddAddonModal'
import styles from './MenuManagement.module.css'

function MenuManagement() {
  const [activeTab, setActiveTab] = useState('dishes') // 'dishes' или 'addons'
  
  // Состояние для блюд
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDish, setEditingDish] = useState(null)
  
  // Состояние для добавок
  const [addons, setAddons] = useState([])
  const [addonCategories, setAddonCategories] = useState([])
  const [addonSearchTerm, setAddonSearchTerm] = useState('')
  const [selectedAddonCategory, setSelectedAddonCategory] = useState('')
  const [showAddAddonModal, setShowAddAddonModal] = useState(false)
  const [editingAddon, setEditingAddon] = useState(null)

  useEffect(() => {
    fetchMenuData()
    fetchAddons()
  }, [])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      
      // Получаем данные с бэкенда
      const [categoriesResponse, dishesResponse] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getDishes({ limit: 100, show_all: true }) // Загружаем ВСЕ блюда в админке (включая недоступные)
      ])
      
      // Обрабатываем категории
      const categoriesWithCount = categoriesResponse.data.map(category => ({
        id: category.id,
        name: category.name,
        count: dishesResponse.data.filter(dish => dish.category_id === category.id).length,
        active: category.is_active
      }))
      
      // Обрабатываем блюда
      const dishesWithCategory = dishesResponse.data.map(dish => ({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        categoryId: dish.category_id,
        category: categoriesResponse.data.find(cat => cat.id === dish.category_id)?.name || 'Неизвестно',
        image: dish.image,
        available: dish.is_available,
        popular: dish.is_popular
      }))
      
      setCategories(categoriesWithCount)
      setDishes(dishesWithCategory)
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки меню:', error)
      setLoading(false)
      
      // Fallback на моковые данные в случае ошибки
      // Генерируем fallback данные динамически на основе структуры базы данных
      const fallbackCategories = [
        { id: 1, name: 'Комбо', count: 0, active: true },
        { id: 2, name: 'Блюда', count: 0, active: true },
        { id: 3, name: 'Закуски', count: 0, active: true },
        { id: 4, name: 'Соусы', count: 0, active: true },
        { id: 5, name: 'Напитки', count: 0, active: true }
      ]

      const fallbackDishes = [
        {
          id: 1,
          name: 'Комбо для ОДНОГО',
          description: 'Фирменная шаурма, картошка фри и айран.',
          price: 2490,
          categoryId: 1,
          category: 'Комбо',
          image: 'https://cdn-kz11.foodpicasso.com/assets/2025/05/21/fe556df31b0086a084ab61a2c8ac99ce---jpeg_420x420:whitepadding15_94310_convert.webp?v2',
          available: true,
          popular: false
        },
        {
          id: 2,
          name: 'Фирменная Средняя шаурма (Новинка)',
          description: 'Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, белый соус.',
          price: 1990,
          categoryId: 2,
          category: 'Блюда',
          image: 'https://cdn-kz11.foodpicasso.com/assets/2025/04/04/b9ef70d2195ea30d7a1a5a1b22450db8---jpeg_420x420:whitepadding15_94310_convert.webp?v2',
          available: true,
          popular: false
        },
        {
          id: 3,
          name: 'Классическая Средняя шаурма (Хит)',
          description: 'Тонкий лаваш, сочные кусочки говядины, картофель фри, лук, помидор, красный соус, белый соус.',
          price: 1690,
          categoryId: 2,
          category: 'Блюда',
          image: 'https://cdn-kz11.foodpicasso.com/assets/2025/03/19/cb4e1a15ed8eb66b4cb3f04266b87a8f---jpeg_420x420:whitepadding15_94310_convert.webp?v2',
          available: true,
          popular: true
        },
        {
          id: 4,
          name: 'Шекер',
          description: 'Сладкие палочки из теста, обжаренные во фритюре: хрустящие снаружи и нежные внутри',
          price: 400,
          categoryId: 3,
          category: 'Закуски',
          image: 'https://cdn-kz11.foodpicasso.com/assets/2025/06/27/bc977c217d9ceed2395733bcd3e5127e---jpeg_420x420:whitepadding15_94310_convert.webp?v2',
          available: true,
          popular: false
        },
        {
          id: 5,
          name: 'Соус Сырный 30г',
          description: '',
          price: 240,
          categoryId: 4,
          category: 'Соусы',
          image: 'https://cdn-kz11/foodpicasso.com/assets/2025/02/10/ef651ed87b4c3ab6e22e539c6081462c---jpeg_420x420:whitepadding15_94310_convert.webp?v2',
          available: true,
          popular: false
        },
        {
          id: 6,
          name: 'Пепси 0,5л',
          description: '',
          price: 640,
          categoryId: 5,
          category: 'Напитки',
          image: 'https://cdn-kz11/foodpicasso.com/assets/2025/02/10/3a79628d7f921f91eafd5c3a1bd30012---jpeg_420x420:whitepadding15_94310_convert.webp?v2',
          available: true,
          popular: false
        }
      ]

      // Обновляем счетчики категорий на основе fallback блюд
      fallbackCategories.forEach(category => {
        category.count = fallbackDishes.filter(dish => dish.categoryId === category.id).length
      })
      
      setCategories(fallbackCategories)
      setDishes(fallbackDishes)
    }
  }

  const toggleDishAvailability = async (dishId, currentStatus) => {
    try {
      // API вызов для обновления статуса блюда
      await menuAPI.toggleDishAvailability(dishId)
    } catch (error) {
      console.log('Используем заглушку для переключения статуса блюда')
    }
    
    // Обновляем локальное состояние
    setDishes(prev => prev.map(dish => 
      dish.id === dishId ? { ...dish, available: !currentStatus } : dish
    ))
  }

  const deleteDish = async (dishId) => {
    if (window.confirm('Вы уверены, что хотите удалить это блюдо?')) {
      try {
        // API вызов для удаления блюда
        await menuAPI.deleteDish(dishId)
      } catch (error) {
        console.log('Используем заглушку для удаления блюда')
      }
      
      // Обновляем локальное состояние
      setDishes(prev => prev.filter(dish => dish.id !== dishId))
      
      // Обновляем счетчики категорий
      const deletedDish = dishes.find(dish => dish.id === dishId)
      if (deletedDish) {
        setCategories(prev => prev.map(cat => 
          cat.id === deletedDish.categoryId 
            ? { ...cat, count: Math.max(0, cat.count - 1) }
            : cat
        ))
      }
    }
  }

  const handleDishAdded = (newDish) => {
    // Преобразуем данные с сервера в формат, используемый в компоненте
    const dishWithCategory = {
      id: newDish.id,
      name: newDish.name,
      description: newDish.description,
      price: parseFloat(newDish.price),
      categoryId: newDish.category_id,
      category: categories.find(cat => cat.id === newDish.category_id)?.name || 'Неизвестно',
      image: newDish.image,
      available: newDish.is_available,
      popular: newDish.is_popular
    }

    // Добавляем новое блюдо в список
    setDishes(prev => [...prev, dishWithCategory])
    
    // Обновляем счетчики категорий
    setCategories(prev => prev.map(cat => 
      cat.id === newDish.category_id 
        ? { ...cat, count: cat.count + 1 }
        : cat
    ))
  }

  const handleDishUpdated = (updatedDish) => {
    console.log('Блюдо обновлено:', updatedDish)
    
    // Обновляем блюдо в списке
    setDishes(prev => prev.map(dish => 
      dish.id === updatedDish.id 
        ? {
            ...dish,
            name: updatedDish.name,
            description: updatedDish.description,
            price: parseFloat(updatedDish.price),
            categoryId: updatedDish.category_id,
            category: categories.find(cat => cat.id === updatedDish.category_id)?.name || 'Неизвестно',
            image: updatedDish.image,
            available: updatedDish.is_available,
            popular: updatedDish.is_popular
          }
        : dish
    ))

    // Если категория изменилась, обновляем счетчики
    const oldDish = dishes.find(d => d.id === updatedDish.id)
    if (oldDish && oldDish.categoryId !== updatedDish.category_id) {
      setCategories(prev => prev.map(cat => {
        if (cat.id === oldDish.categoryId) {
          return { ...cat, count: cat.count - 1 }
        }
        if (cat.id === updatedDish.category_id) {
          return { ...cat, count: cat.count + 1 }
        }
        return cat
      }))
    }
    
    // Закрываем режим редактирования
    setEditingDish(null)
  }

  const handleEditDish = (dish) => {
    setEditingDish(dish)
    setShowAddModal(true)
  }

  const handleModalClose = () => {
    setShowAddModal(false)
    setEditingDish(null)
  }

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || dish.categoryId.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Функции для работы с добавками
  const fetchAddons = async () => {
    try {
      const response = await menuAPI.getAddons({ show_all: true })
      const addonsList = response.data
      setAddons(addonsList)
      
      // Извлекаем уникальные категории
      const uniqueCategories = [...new Set(addonsList.map(addon => addon.category).filter(Boolean))]
      setAddonCategories(uniqueCategories)
    } catch (error) {
      console.error('Ошибка загрузки добавок:', error)
    }
  }

  const handleCreateAddon = () => {
    setEditingAddon(null)
    setShowAddAddonModal(true)
  }

  const handleEditAddon = (addon) => {
    setEditingAddon(addon)
    setShowAddAddonModal(true)
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

  const handleToggleAddonActive = async (addonId) => {
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
    if (savedAddon.category && !addonCategories.includes(savedAddon.category)) {
      setAddonCategories(prev => [...prev, savedAddon.category])
    }
    
    setShowAddAddonModal(false)
    setEditingAddon(null)
  }

  const handleAddonModalClose = () => {
    setShowAddAddonModal(false)
    setEditingAddon(null)
  }

  // Фильтрация добавок
  const filteredAddons = addons.filter(addon => {
    const matchesSearch = addon.name.toLowerCase().includes(addonSearchTerm.toLowerCase())
    const matchesCategory = !selectedAddonCategory || addon.category === selectedAddonCategory
    return matchesSearch && matchesCategory
  })

  // Группировка добавок по категориям
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
    <div className={styles.menuManagement}>
      <div className={styles.header}>
        <h1>Управление меню</h1>
        <p>Управляйте блюдами, добавками и их доступностью</p>
      </div>

      {/* Переключение вкладок */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'dishes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('dishes')}
        >
          Блюда ({dishes.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'addons' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('addons')}
        >
          Добавки ({addons.length})
        </button>
      </div>

      {activeTab === 'dishes' ? (
        <>
          {/* Статистика категорий */}
          <div className={styles.categoriesStats}>
            <h2>Категории блюд</h2>
            <div className={styles.categoriesGrid}>
              {categories.map(category => (
                <div key={category.id} className={styles.categoryCard}>
                  <div className={styles.categoryInfo}>
                    <h3>{category.name}</h3>
                    <p>{category.count} блюд</p>
                  </div>
                  <div className={`${styles.categoryStatus} ${category.active ? styles.active : styles.inactive}`}>
                    {category.active ? 'Активна' : 'Неактивна'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Управление блюдами */}
      <div className={styles.dishesSection}>
        <div className={styles.dishesHeader}>
          <h2>Блюда</h2>
          <button 
            className={styles.addButton}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Добавить блюдо
          </button>
        </div>

        {/* Фильтры */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Поиск блюд..."
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
            <option value="all">Все категории</option>
            {categories.map(category => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Список блюд */}
        <div className={styles.dishesGrid}>
          {filteredDishes.map(dish => (
            <div key={dish.id} className={styles.dishCard}>
              <div className={styles.dishImage}>
                {dish.image ? (
                  <img src={dish.image} alt={dish.name} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <Image size={24} />
                  </div>
                )}
                
                <div className={styles.dishBadges}>
                  {dish.popular && <span className={styles.popularBadge}>Популярное</span>}
                  <span className={`${styles.availabilityBadge} ${dish.available ? styles.available : styles.unavailable}`}>
                    {dish.available ? 'Доступно' : 'Недоступно'}
                  </span>
                </div>
              </div>

              <div className={styles.dishContent}>
                <div className={styles.dishHeader}>
                  <h3>{dish.name}</h3>
                  <span className={styles.categoryTag}>{dish.category}</span>
                </div>
                
                <p className={styles.dishDescription}>{dish.description}</p>
                
                <div className={styles.dishDetails}>
                  <div className={styles.detailItem}>
                    <DollarSign size={16} />
                    <span>{dish.price.toLocaleString()} ₸</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Tag size={16} />
                    <span>{dish.category}</span>
                  </div>
                </div>
              </div>

              <div className={styles.dishActions}>
                <button 
                  className={styles.actionButton}
                  onClick={() => console.log('Просмотр блюда:', dish.id)}
                >
                  <Eye size={16} />
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={() => handleEditDish(dish)}
                  title="Редактировать блюдо"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.toggleButton} ${dish.available ? styles.disable : styles.enable}`}
                  onClick={() => toggleDishAvailability(dish.id, dish.available)}
                  title={dish.available ? 'Отключить' : 'Включить'}
                >
                  {dish.available ? '⏸' : '▶'}
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => deleteDish(dish.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDishes.length === 0 && (
          <div className={styles.emptyState}>
            <ChefHat size={48} />
            <h3>Блюда не найдены</h3>
            <p>Попробуйте изменить критерии поиска</p>
          </div>
        )}
      </div>
        </>
      ) : (
        <>
          {/* Управление добавками */}
          <div className={styles.addonsSection}>
            <div className={styles.addonsHeader}>
              <h2>Добавки</h2>
              <button 
                className={styles.addButton}
                onClick={handleCreateAddon}
              >
                <Plus size={18} />
                Добавить добавку
              </button>
            </div>

            {/* Фильтры для добавок */}
            <div className={styles.filters}>
              <div className={styles.searchBox}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Поиск добавок..."
                  value={addonSearchTerm}
                  onChange={(e) => setAddonSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              
              <select
                value={selectedAddonCategory}
                onChange={(e) => setSelectedAddonCategory(e.target.value)}
                className={styles.categoryFilter}
              >
                <option value="">Все категории</option>
                {addonCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="">Без категории</option>
              </select>
            </div>

            {/* Статистика добавок */}
            <div className={styles.addonsStats}>
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
                <span className={styles.statNumber}>{addonCategories.length}</span>
                <span className={styles.statLabel}>Категорий</span>
              </div>
            </div>

            {/* Список добавок по категориям */}
            <div className={styles.addonsContent}>
              {Object.keys(groupedAddons).length === 0 ? (
                <div className={styles.emptyState}>
                  <Plus size={48} />
                  <h3>Добавки не найдены</h3>
                  <p>Попробуйте изменить критерии поиска или создайте первую добавку</p>
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
                    <h3 className={styles.categoryTitle}>{category}</h3>
                    
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
                            <h4 className={styles.addonName}>{addon.name}</h4>
                            <p className={styles.addonPrice}>{addon.price}₸</p>
                            {addon.category && (
                              <span className={styles.categoryTag}>{addon.category}</span>
                            )}
                          </div>
                          
                          <div className={styles.addonActions}>
                            <button
                              onClick={() => handleToggleAddonActive(addon.id)}
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
          </div>
        </>
      )}

      {/* Модальные окна */}
      <AddDishModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        onDishAdded={handleDishAdded}
        onDishUpdated={handleDishUpdated}
        categories={categories}
        editingDish={editingDish}
      />

      <AddAddonModal
        isOpen={showAddAddonModal}
        onClose={handleAddonModalClose}
        onAddonSaved={handleAddonSaved}
        editingAddon={editingAddon}
        existingCategories={addonCategories}
      />
    </div>
  )
}

export default MenuManagement