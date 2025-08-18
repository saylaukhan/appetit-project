import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  Image,
  DollarSign,
  ChefHat,
  Tag
} from 'lucide-react'
import { menuAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './MenuManagement.module.css'

function MenuManagement() {
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      // В реальном приложении здесь будут API вызовы
      // const [categoriesResponse, dishesResponse] = await Promise.all([
      //   menuAPI.getCategories(),
      //   menuAPI.getDishes()
      // ])
      
      // Пока используем моковые данные
      setTimeout(() => {
        const mockCategories = [
          { id: 1, name: 'Пицца', count: 8, active: true },
          { id: 2, name: 'Бургеры', count: 5, active: true },
          { id: 3, name: 'Роллы и суши', count: 12, active: true },
          { id: 4, name: 'Салаты', count: 6, active: true },
          { id: 5, name: 'Супы', count: 4, active: true },
          { id: 6, name: 'Напитки', count: 8, active: true },
          { id: 7, name: 'Десерты', count: 3, active: true }
        ]

        const mockDishes = [
          {
            id: 1,
            name: 'Пицца Маргарита',
            description: 'Классическая пицца с томатным соусом, моцареллой и базиликом',
            price: 2500,
            weight: '400г',
            categoryId: 1,
            category: 'Пицца',
            image: '/static/dishes/margherita.jpg',
            available: true,
            popular: true,
            calories: 890,
            preparationTime: 25
          },
          {
            id: 2,
            name: 'Пицца Пепперони',
            description: 'Острая пицца с салями пепперони и моцареллой',
            price: 3200,
            weight: '450г',
            categoryId: 1,
            category: 'Пицца',
            image: '/static/dishes/pepperoni.jpg',
            available: true,
            popular: true,
            calories: 1120,
            preparationTime: 25
          },
          {
            id: 3,
            name: 'Бургер Классик',
            description: 'Сочная говяжья котлета, салат, помидор, лук, соус',
            price: 2200,
            weight: '350г',
            categoryId: 2,
            category: 'Бургеры',
            image: '/static/dishes/classic-burger.jpg',
            available: true,
            popular: false,
            calories: 780,
            preparationTime: 15
          },
          {
            id: 4,
            name: 'Ролл Филадельфия',
            description: 'Ролл с лососем, сливочным сыром и огурцом',
            price: 1800,
            weight: '220г',
            categoryId: 3,
            category: 'Роллы и суши',
            image: '/static/dishes/philadelphia.jpg',
            available: true,
            popular: true,
            calories: 420,
            preparationTime: 20
          },
          {
            id: 5,
            name: 'Салат Цезарь',
            description: 'Классический салат с курицей гриль и пармезаном',
            price: 1500,
            weight: '300г',
            categoryId: 4,
            category: 'Салаты',
            image: '/static/dishes/caesar.jpg',
            available: false,
            popular: false,
            calories: 380,
            preparationTime: 10
          }
        ]
        
        setCategories(mockCategories)
        setDishes(mockDishes)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Ошибка загрузки меню:', error)
      setLoading(false)
    }
  }

  const toggleDishAvailability = async (dishId, currentStatus) => {
    try {
      // В реальном приложении здесь будет API вызов
      setDishes(prev => prev.map(dish => 
        dish.id === dishId ? { ...dish, available: !currentStatus } : dish
      ))
    } catch (error) {
      console.error('Ошибка обновления статуса блюда:', error)
    }
  }

  const deleteDish = async (dishId) => {
    if (window.confirm('Вы уверены, что хотите удалить это блюдо?')) {
      try {
        // В реальном приложении здесь будет API вызов
        setDishes(prev => prev.filter(dish => dish.id !== dishId))
      } catch (error) {
        console.error('Ошибка удаления блюда:', error)
      }
    }
  }

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || dish.categoryId.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={styles.menuManagement}>
      <div className={styles.header}>
        <h1>Управление меню</h1>
        <p>Управляйте категориями, блюдами и их доступностью</p>
      </div>

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
            onClick={() => setShowAddForm(true)}
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
                    <span>{dish.weight}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <ChefHat size={16} />
                    <span>{dish.preparationTime} мин</span>
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
                  onClick={() => console.log('Редактировать блюдо:', dish.id)}
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
    </div>
  )
}

export default MenuManagement