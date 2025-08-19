import React, { useState, useEffect } from 'react'
import { menuAPI } from '../../services/api'
import { useCart } from '../../contexts/CartContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import styles from './MenuPage.module.css'

function MenuPage() {
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null) // Для подсветки при скролле
  const [loading, setLoading] = useState(true)
  const [dishesLoading, setDishesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('category') // 'alphabet', 'new', 'category'
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const { addItem, isInCart, getItemQuantity } = useCart()

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    loadCategories()
  }, [])

  // Загрузка блюд при монтировании и изменении поискового запроса
  useEffect(() => {
    loadDishes()
  }, [searchQuery])

  // Закрытие выпадающего меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownOpen) {
        const dropdown = event.target.closest(`.${styles.sortDropdown}`)
        const dropdownMenu = event.target.closest(`.${styles.sortDropdownMenu}`)
        
        if (!dropdown && !dropdownMenu) {
          setSortDropdownOpen(false)
        }
      }
    }

    const handleScroll = () => {
      if (sortDropdownOpen) {
        setSortDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [sortDropdownOpen])

  // Обработчик скролла для подсветки активной категории
  useEffect(() => {
    const handleScroll = () => {
      const categoryElements = categories.map(cat => ({
        id: cat.id,
        element: document.getElementById(`category-${cat.id}`)
      })).filter(item => item.element)

      const scrollPosition = window.scrollY + 150 // Отступ для активации

      // Найдем активную категорию
      let currentActiveCategory = null
      
      for (let i = categoryElements.length - 1; i >= 0; i--) {
        const { id, element } = categoryElements[i]
        if (element.offsetTop <= scrollPosition) {
          currentActiveCategory = id
          break
        }
      }

      // Если скролл в самом верху, убираем активную категорию
      if (window.scrollY < 100) {
        currentActiveCategory = null
      }

      setActiveCategory(currentActiveCategory)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [categories])

  // Функция для группировки блюд по категориям
  const groupDishesByCategory = (dishesToGroup) => {
    const grouped = {}
    
    // Инициализируем группы для всех категорий
    categories.forEach(category => {
      grouped[category.id] = {
        category,
        dishes: []
      }
    })

    // Группируем блюда
    dishesToGroup.forEach(dish => {
      if (grouped[dish.category_id]) {
        grouped[dish.category_id].dishes.push(dish)
      }
    })

    // Сортируем блюда внутри каждой категории
    Object.values(grouped).forEach(group => {
      group.dishes = sortDishes(group.dishes)
    })

    // Возвращаем только категории с блюдами, отсортированные по sort_order
    return Object.values(grouped)
      .filter(group => group.dishes.length > 0)
      .sort((a, b) => a.category.sort_order - b.category.sort_order)
  }

  const loadCategories = async () => {
    try {
      setError(null)
      console.log('Загружаем категории...')
      const response = await menuAPI.getCategories()
      console.log('Ответ от API категории:', response)
      setCategories(response.data || [])
      console.log('Загружено категорий:', response.data?.length || 0)
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
      console.error('Детали ошибки:', error.response?.data)
      setError(`Не удалось загрузить категории меню: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadDishes = async () => {
    setDishesLoading(true)
    try {
      console.log('Загружаем блюда...')
      const params = { limit: 100 } // Загружаем все блюда
      if (searchQuery) params.search = searchQuery

      const response = await menuAPI.getDishes(params)
      console.log('Ответ от API блюда:', response)
      setDishes(response.data || [])
      console.log('Загружено блюд:', response.data?.length || 0)
    } catch (error) {
      console.error('Ошибка загрузки блюд:', error)
      console.error('Детали ошибки:', error.response?.data)
      setError(`Не удалось загрузить блюда: ${error.message}`)
    } finally {
      setDishesLoading(false)
    }
  }

  const handleCategorySelect = (categoryId) => {
    if (categoryId === null) {
      // Прокрутка в начало страницы для "Все блюда"
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setSelectedCategory(null)
      setActiveCategory(null)
    } else {
      // Прокрутка к заголовку категории
      const categoryElement = document.getElementById(`category-${categoryId}`)
      if (categoryElement) {
        const headerOffset = 100 // Отступ от верха
        const elementPosition = categoryElement.offsetTop
        const offsetPosition = elementPosition - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
      setSelectedCategory(categoryId)
      setActiveCategory(categoryId)
    }
  }

  const handleAddToCart = (dish) => {
    addItem(dish)
  }

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
    setSortDropdownOpen(false)
  }

  const toggleSortDropdown = (event) => {
    const newOpen = !sortDropdownOpen
    console.log('Toggle dropdown:', newOpen)
    
    if (newOpen) {
      // Вычисляем позицию кнопки для позиционирования выпадающего меню
      const buttonRect = event.currentTarget.getBoundingClientRect()
      setDropdownPosition({
        top: buttonRect.bottom + 4, // 4px отступ
        left: buttonRect.left,
        width: buttonRect.width
      })
    }
    
    setSortDropdownOpen(newOpen)
  }

  const getSortLabel = (sortType) => {
    switch (sortType) {
      case 'category':
        return 'По категориям'
      case 'alphabet':
        return 'По алфавиту'
      case 'new':
        return 'Новинки и хиты'
      default:
        return 'По категориям'
    }
  }

  // Функция сортировки блюд
  const sortDishes = (dishesToSort) => {
    const sorted = [...dishesToSort]
    
    switch (sortBy) {
      case 'alphabet':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      
      case 'new':
        // Сортируем по ID (новые блюда имеют больший ID) и популярности
        return sorted.sort((a, b) => {
          // Сначала новинки (предполагаем, что новинки имеют слово "Новинка" в названии)
          const aIsNew = a.name.includes('Новинка')
          const bIsNew = b.name.includes('Новинка')
          if (aIsNew && !bIsNew) return -1
          if (!aIsNew && bIsNew) return 1
          
          // Затем по популярности
          if (a.is_popular && !b.is_popular) return -1
          if (!a.is_popular && b.is_popular) return 1
          
          // Затем по ID (новые записи)
          return b.id - a.id
        })
      
      case 'category':
        return sorted.sort((a, b) => {
          // Сортируем по category_id, затем по порядку внутри категории
          if (a.category_id !== b.category_id) {
            return a.category_id - b.category_id
          }
          // Внутри категории сортируем по популярности, затем по названию
          if (a.is_popular && !b.is_popular) return -1
          if (!a.is_popular && b.is_popular) return 1
          return a.name.localeCompare(b.name, 'ru')
        })
      
      default:
        return sorted
    }
  }

  const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(0)} ₸`
  }

  // SVG placeholder для изображений блюд
  const createPlaceholderImage = () => {
    // Простой SVG placeholder без кодирования
    return `data:image/svg+xml,%3Csvg width='250' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='250' height='200' fill='%23f8f9fa'/%3E%3Ccircle cx='125' cy='100' r='30' fill='%23dee2e6'/%3E%3C/svg%3E`
  }

  if (loading) {
    return (
      <div className={styles.menuContainer}>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.menuContainer}>
        <div className={styles.errorMessage}>
          <h2>Ошибка загрузки меню</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.menuContainer}>
      {/* Баннер с акцией */}
      <div className={styles.promoBanner}>
        <div className={styles.promoContent}>
          <div className={styles.promoText}>
            <h2>КАЖДЫЙ ВТОРНИК</h2>
            <div className={styles.promoOffer}>1+1</div>
            <p>НА ФИРМЕННУЮ<br />СРЕДНЮЮ ШАУРМУ</p>
          </div>
          <div className={styles.promoImages}>
            <img 
              src="https://cdn-kz11.foodpicasso.com/assets/2025/03/19/cb4e1a15ed8eb66b4cb3f04266b87a8f---jpeg_420x420:whitepadding15_94310_convert.webp?v2" 
              alt="Фирменная шаурма"
              onError={(e) => {
                e.target.src = createPlaceholderImage()
              }}
            />
            <img 
              src="https://cdn-kz11.foodpicasso.com/assets/2025/04/04/b9ef70d2195ea30d7a1a5a1b22450db8---jpeg_420x420:whitepadding15_94310_convert.webp?v2" 
              alt="Классическая шаурма"
              onError={(e) => {
                e.target.src = createPlaceholderImage()
              }}
            />
          </div>
          <div className={styles.promoLabel}>1+1</div>
        </div>
      </div>

      <div className={styles.menuContent}>
        {/* Боковое меню */}
        <aside className={styles.sidebar}>
          {/* Панель категорий */}
          <div className={styles.sidebarPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Категории</h3>
            </div>
            <div className={styles.panelContent}>
              <div className={styles.categoryList}>
                <button
                  className={`${styles.categoryItem} ${activeCategory === null ? styles.active : ''}`}
                  onClick={() => handleCategorySelect(null)}
                >
                  Все блюда
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`${styles.categoryItem} ${activeCategory === category.id ? styles.active : ''}`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Панель сортировки */}
          <div className={styles.sidebarPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Сортировка</h3>
            </div>
            <div className={styles.panelContent}>
              <div className={styles.sortDropdown}>
                <button
                  className={`${styles.sortToggle} ${sortDropdownOpen ? styles.open : ''}`}
                  onClick={toggleSortDropdown}
                >
                  <span className={styles.sortLabel}>{getSortLabel(sortBy)}</span>
                  <span className={styles.dropdownArrow}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
                
                {sortDropdownOpen && (
                  <div 
                    className={styles.sortDropdownMenu}
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`
                    }}
                  >
                    <button
                      className={`${styles.sortOption} ${sortBy === 'category' ? styles.active : ''}`}
                      onClick={() => handleSortChange('category')}
                    >
                      По категориям
                    </button>
                    <button
                      className={`${styles.sortOption} ${sortBy === 'alphabet' ? styles.active : ''}`}
                      onClick={() => handleSortChange('alphabet')}
                    >
                      По алфавиту
                    </button>
                    <button
                      className={`${styles.sortOption} ${sortBy === 'new' ? styles.active : ''}`}
                      onClick={() => handleSortChange('new')}
                    >
                      Новинки и хиты
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Основной контент */}
        <main className={styles.mainContent}>
          {/* Поиск */}
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Поиск блюд..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Заголовок секции */}
          <div className={styles.sectionHeader}>
            <h2>Меню ресторана</h2>
            {searchQuery && (
              <p className={styles.searchInfo}>Результаты поиска: "{searchQuery}"</p>
            )}
          </div>

          {/* Блюда по категориям */}
          {dishesLoading ? (
            <div className={styles.dishesLoading}>
              <LoadingSpinner />
            </div>
          ) : (
            <div className={styles.menuSections}>
              {dishes.length > 0 ? (
                // Если есть поисковый запрос, показываем все блюда в одной сетке
                searchQuery ? (
                  <div className={styles.dishesGrid}>
                    {sortDishes(dishes).map((dish) => (
                      <DishCard 
                        key={dish.id} 
                        dish={dish} 
                        onAddToCart={handleAddToCart}
                        isInCart={isInCart}
                        getItemQuantity={getItemQuantity}
                        formatPrice={formatPrice}
                        createPlaceholderImage={createPlaceholderImage}
                      />
                    ))}
                  </div>
                ) : (
                  // Иначе группируем по категориям
                  groupDishesByCategory(dishes).map((group) => (
                    <div key={group.category.id} className={styles.categorySection}>
                      <div 
                        id={`category-${group.category.id}`}
                        className={styles.categoryHeader}
                      >
                        <h3 className={styles.categoryTitle}>{group.category.name}</h3>
                        {group.category.description && (
                          <p className={styles.categoryDescription}>{group.category.description}</p>
                        )}
                      </div>
                      
                      <div className={styles.dishesGrid}>
                        {group.dishes.map((dish) => (
                          <DishCard 
                            key={dish.id} 
                            dish={dish} 
                            onAddToCart={handleAddToCart}
                            isInCart={isInCart}
                            getItemQuantity={getItemQuantity}
                            formatPrice={formatPrice}
                            createPlaceholderImage={createPlaceholderImage}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className={styles.noDishes}>
                  <p>Блюда не найдены</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Компонент карточки блюда
function DishCard({ dish, onAddToCart, isInCart, getItemQuantity, formatPrice, createPlaceholderImage }) {
  return (
    <div className={styles.dishCard}>
      <div className={styles.dishImage}>
        <img 
          src={dish.image || createPlaceholderImage()} 
          alt={dish.name}
          onError={(e) => {
            // Если это первая попытка и есть изображение, попробуем загрузить еще раз
            const placeholderSrc = createPlaceholderImage()
            if (e.target.src !== placeholderSrc && !e.target.dataset.retried && dish.image) {
              e.target.dataset.retried = 'true'
              console.log(`Повторная попытка загрузки изображения для: ${dish.name}`)
              // Попробуем загрузить изображение с небольшой задержкой
              setTimeout(() => {
                e.target.src = dish.image
              }, 1000)
            } else {
              // Показываем placeholder только после неудачной повторной попытки
              console.log(`Не удалось загрузить изображение для: ${dish.name}, используем placeholder`)
              e.target.src = placeholderSrc
            }
          }}
          onLoad={(e) => {
            // Убираем флаг повторной попытки при успешной загрузке
            delete e.target.dataset.retried
          }}
        />
        {dish.is_popular && (
          <div className={styles.popularBadge}>Хит</div>
        )}
      </div>
      
      <div className={styles.dishInfo}>
        <h3 className={styles.dishName}>{dish.name}</h3>
        
        {dish.description && (
          <p className={styles.dishDescription}>{dish.description}</p>
        )}
        
        <div className={styles.dishMeta}>
          {dish.weight && (
            <span className={styles.dishWeight}>{dish.weight}</span>
          )}
        </div>
        
        <div className={styles.dishFooter}>
          <div className={styles.dishPrice}>
            {formatPrice(dish.price)}
          </div>
          
          <button
            onClick={() => onAddToCart(dish)}
            className={`${styles.addToCartBtn} ${isInCart(dish.id) ? styles.inCart : ''}`}
            disabled={!dish.is_available}
          >
            {!dish.is_available ? 'Недоступно' :
             isInCart(dish.id) ? `В корзине (${getItemQuantity(dish.id)})` : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MenuPage