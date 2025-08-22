import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Minus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { menuAPI } from '../../services/api'
import { useAddress } from '../../hooks/useAddress'
import styles from './DishModal.module.css'

const DishModal = ({ isOpen, onClose, dishId, onAddToCart, onShowAddressModal }) => {
  const [dish, setDish] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState({}) // { groupId: variantId }
  const [selectedAddons, setSelectedAddons] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
  const [quantity, setQuantity] = useState(1)

  
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { checkUserAddress, getUserAddress } = useAddress()

  // Загружаем данные блюда
  useEffect(() => {
    if (isOpen && dishId) {
      loadDish()
    }
  }, [isOpen, dishId])

  // Пересчитываем цену при изменении выбора
  useEffect(() => {
    if (dish) {
      calculateTotalPrice()
    }
  }, [dish, selectedVariants, selectedAddons, quantity])

  const loadDish = async () => {
    setLoading(true)
    try {
      const response = await menuAPI.getDish(dishId)
      setDish(response.data)
      
      // Устанавливаем значения по умолчанию для вариантов
      const defaultVariants = {}
      if (response.data.variant_groups?.length > 0) {
        response.data.variant_groups.forEach(group => {
          // Ищем вариант по умолчанию или берем первый
          const defaultVariant = group.variants.find(v => v.is_default) || group.variants[0]
          if (defaultVariant) {
            defaultVariants[group.id] = defaultVariant.id
          }
        })
      }
      setSelectedVariants(defaultVariants)
    } catch (error) {
      console.error('Ошибка загрузки блюда:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPrice = () => {
    if (!dish) return

    let price = parseFloat(dish.price)

    // Добавляем стоимость выбранных вариантов
    Object.entries(selectedVariants).forEach(([groupId, variantId]) => {
      if (variantId) {
        const group = dish.variant_groups?.find(g => g.id === parseInt(groupId))
        if (group) {
          const variant = group.variants.find(v => v.id === variantId)
          if (variant && variant.price) {
            price += parseFloat(variant.price)
          }
        }
      }
    })

    // Добавляем стоимость добавок
    Object.entries(selectedAddons).forEach(([addonId, quantity]) => {
      if (quantity > 0) {
        const addon = dish.addons?.find(a => a.id === parseInt(addonId))
        if (addon) {
          price += parseFloat(addon.price) * quantity
        }
      }
    })

    setTotalPrice(price * quantity)
  }

  const handleAddonChange = (addonId, change) => {
    setSelectedAddons(prev => {
      const currentQuantity = prev[addonId] || 0
      const newQuantity = Math.max(0, currentQuantity + change)
      
      if (newQuantity === 0) {
        const { [addonId]: removed, ...rest } = prev
        return rest
      }
      
      return {
        ...prev,
        [addonId]: newQuantity
      }
    })
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      onClose()
      return
    }
  
    if (!dish) return

    // Проверяем наличие адреса у пользователя
    try {
      const hasAddress = await checkUserAddress()
      
      if (!hasAddress) {
        // Если адреса нет, закрываем модальное окно блюда и вызываем обработчик для показа адреса
        const currentAddress = await getUserAddress()
        onClose() // Закрываем текущее модальное окно блюда
        if (onShowAddressModal) {
          onShowAddressModal(currentAddress, dish, selectedVariants, selectedAddons, quantity)
        }
        return
      }
      
      // Если адрес есть, продолжаем с добавлением в корзину
      proceedToAddToCart()
    } catch (error) {
      console.error('Ошибка проверки адреса:', error)
      alert('Произошла ошибка. Попробуйте снова.')
    }
  }

  const proceedToAddToCart = () => {
    // Подготавливаем выбранные варианты
    const variants = Object.entries(selectedVariants).map(([groupId, variantId]) => {
      const group = dish.variant_groups?.find(g => g.id === parseInt(groupId))
      const variant = group?.variants.find(v => v.id === variantId)
      return {
        groupId: parseInt(groupId),
        groupName: group?.name,
        variantId: variantId,
        variantName: variant?.name,
        price: parseFloat(variant?.price || 0)
      }
    }).filter(variant => variant.variantId)
    
    // Подготавливаем добавки
    const addons = Object.entries(selectedAddons).map(([addonId, quantity]) => {
      const addon = dish.addons?.find(a => a.id === parseInt(addonId))
      return {
        id: parseInt(addonId),
        name: addon?.name,
        price: parseFloat(addon?.price || 0),
        quantity
      }
    }).filter(addon => addon.quantity > 0)

    onAddToCart(dish, variants, addons, quantity)
    onClose()
  }



  const groupedAddons = dish?.addons?.reduce((groups, addon) => {
    const category = addon.category || 'Другое'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(addon)
    return groups
  }, {}) || {}

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>

        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : dish ? (
          <div className={styles.content}>
            {/* Левая часть - изображение */}
            <div className={styles.leftSection}>
              <div className={styles.dishImage}>
                <img 
                  src={dish.image || 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=Блюдо'} 
                  alt={dish.name}
                />
              </div>
            </div>

            {/* Правая часть - информация и конфигурация */}
            <div className={styles.rightSection}>
              <div className={styles.dishInfo}>
                <h2 className={styles.dishName}>{dish.name}</h2>
                <p className={styles.dishDescription}>
                  {dish.weight && `${dish.weight}, `}
                  {dish.description}
                </p>
              </div>

              {/* Варианты блюда */}
              {dish.variant_groups && dish.variant_groups.length > 0 && dish.variant_groups.map(group => (
                <div key={group.id} className={styles.section}>
                  {dish.variant_groups.length > 1 && (
                    <h3 className={styles.variantGroupTitle}>{group.name}</h3>
                  )}
                  <div className={styles.variantOptions}>
                    {group.variants.map(variant => (
                      <button
                        key={variant.id}
                        className={`${styles.variantOption} ${selectedVariants[group.id] === variant.id ? styles.selected : ''}`}
                        onClick={() => setSelectedVariants(prev => ({
                          ...prev,
                          [group.id]: variant.id
                        }))}
                      >
                        <span className={styles.variantLabel}>{variant.name}</span>
                        {variant.price && variant.price > 0 && (
                          <span className={styles.variantPrice}>+{parseFloat(variant.price).toFixed(0)}₸</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Добавки */}
              {Object.keys(groupedAddons).length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Добавить по вкусу</h3>
                  
                  {Object.entries(groupedAddons).map(([category, addons]) => (
                    <div key={category} className={styles.addonCategory}>
                      {Object.keys(groupedAddons).length > 1 && (
                        <h4 className={styles.categoryTitle}>{category}</h4>
                      )}
                      
                      <div className={styles.addonsGrid}>
                        {addons.map(addon => {
                          const quantity = selectedAddons[addon.id] || 0
                          return (
                            <div key={addon.id} className={styles.addonItem}>
                              <div className={styles.addonInfo}>
                                <span className={styles.addonName}>{addon.name}</span>
                                <span className={styles.addonPrice}>{parseFloat(addon.price).toFixed(0)} ₸</span>
                              </div>
                              
                              {quantity > 0 ? (
                                <div className={styles.quantityControls}>
                                  <button 
                                    onClick={() => handleAddonChange(addon.id, -1)}
                                    className={styles.quantityBtn}
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className={styles.quantity}>{quantity}</span>
                                  <button 
                                    onClick={() => handleAddonChange(addon.id, 1)}
                                    className={styles.quantityBtn}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleAddonChange(addon.id, 1)}
                                  className={styles.addButton}
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Количество и кнопка добавления в корзину */}
              <div className={styles.footer}>
                <div className={styles.quantitySection}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={styles.quantityBtn}
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className={styles.quantity}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className={styles.quantityBtn}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className={styles.addToCartButton}
                >
                  В корзину за {totalPrice.toFixed(0)} ₸
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.error}>Блюдо не найдено</div>
        )}
      </div>
    </div>
  )
}

export default DishModal
