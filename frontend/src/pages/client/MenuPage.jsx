import React, { useState, useEffect } from 'react'
import { menuAPI } from '../../services/api'
import styles from './MenuPage.module.css'

function MenuPage() {
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMenuData()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadDishes(selectedCategory)
    } else {
      loadDishes()
    }
  }, [selectedCategory])

  const loadMenuData = async () => {
    try {
      const categoriesResponse = await menuAPI.getCategories()
      setCategories(categoriesResponse.data)
      setLoading(false)
    } catch (err) {
      setError('Ошибка загрузки меню')
      setLoading(false)
    }
  }

  const loadDishes = async (categoryId = null) => {
    try {
      const params = categoryId ? { category_id: categoryId } : {}
      const dishesResponse = await menuAPI.getDishes(params)
      setDishes(dishesResponse.data)
    } catch (err) {
      setError('Ошибка загрузки блюд')
    }
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-dish.svg'
    if (imagePath.startsWith('http')) return imagePath
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${imagePath}`
  }

  if (loading) {
    return (
      <div className={styles.menuContainer}>
        <div className={styles.menuContent}>
          <div className={styles.loading}>Загрузка меню...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.menuContainer}>
        <div className={styles.menuContent}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.menuContainer}>
      <div className={styles.menuContent}>
        <h1 className={styles.pageTitle}>Меню ресторана</h1>
        
        {/* Категории */}
        <div className={styles.categoriesContainer}>
          <button 
            className={`${styles.categoryBtn} ${!selectedCategory ? styles.active : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Все блюда
          </button>
          {categories.map(category => (
            <button 
              key={category.id}
              className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Блюда */}
        <div className={styles.dishesGrid}>
          {dishes.length === 0 ? (
            <div className={styles.noDishes}>
              В этой категории пока нет блюд
            </div>
          ) : (
            dishes.map(dish => (
              <div key={dish.id} className={styles.dishCard}>
                <div className={styles.dishImageContainer}>
                  <img 
                    src={getImageUrl(dish.image)} 
                    alt={dish.name}
                    className={styles.dishImage}
                    onError={(e) => {
                      e.target.src = '/placeholder-dish.svg'
                    }}
                  />
                  {!dish.is_available && (
                    <div className={styles.unavailableBadge}>Нет в наличии</div>
                  )}
                </div>
                
                <div className={styles.dishInfo}>
                  <h3 className={styles.dishName}>{dish.name}</h3>
                  <p className={styles.dishDescription}>{dish.description}</p>
                  
                  <div className={styles.dishMeta}>
                    {dish.weight && (
                      <span className={styles.dishWeight}>{dish.weight}</span>
                    )}
                  </div>
                  
                  <div className={styles.dishFooter}>
                    <span className={styles.dishPrice}>{dish.price} ₸</span>
                    <button 
                      className={styles.addToCartBtn}
                      disabled={!dish.is_available}
                    >
                      В корзину
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuPage