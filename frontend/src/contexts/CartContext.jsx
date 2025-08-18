import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { toast } from 'react-hot-toast'

const CartContext = createContext()

// Начальное состояние корзины
const initialState = {
  items: [],
  total: 0,
  itemsCount: 0,
  deliveryType: 'delivery', // 'delivery' или 'pickup'
  promoCode: null,
  discount: 0,
}

// Reducer для управления корзиной
function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...action.payload,
      }

    case 'ADD_ITEM': {
      const { dish, modifiers = [], quantity = 1 } = action.payload
      const itemId = generateItemId(dish.id, modifiers)
      
      const existingItemIndex = state.items.findIndex(item => item.id === itemId)
      
      let newItems
      if (existingItemIndex !== -1) {
        // Увеличиваем количество существующего товара
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Добавляем новый товар
        const itemPrice = calculateItemPrice(dish.price, modifiers)
        const newItem = {
          id: itemId,
          dishId: dish.id,
          name: dish.name,
          image: dish.image,
          basePrice: dish.price,
          price: itemPrice,
          quantity,
          modifiers: modifiers || [],
          dish,
        }
        newItems = [...state.items, newItem]
      }

      const newState = {
        ...state,
        items: newItems,
        ...calculateTotals(newItems, state.discount)
      }

      return newState
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      return {
        ...state,
        items: newItems,
        ...calculateTotals(newItems, state.discount)
      }
    }

    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: itemId })
      }

      const newItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )

      return {
        ...state,
        items: newItems,
        ...calculateTotals(newItems, state.discount)
      }
    }

    case 'CLEAR_CART':
      return {
        ...initialState,
      }

    case 'SET_DELIVERY_TYPE':
      return {
        ...state,
        deliveryType: action.payload,
      }

    case 'APPLY_PROMO_CODE': {
      const { code, discount } = action.payload
      const newState = {
        ...state,
        promoCode: code,
        discount,
        ...calculateTotals(state.items, discount)
      }
      return newState
    }

    case 'REMOVE_PROMO_CODE':
      return {
        ...state,
        promoCode: null,
        discount: 0,
        ...calculateTotals(state.items, 0)
      }

    default:
      return state
  }
}

// Вспомогательные функции
function generateItemId(dishId, modifiers) {
  const modifierIds = modifiers.map(m => m.id).sort().join('-')
  return `${dishId}_${modifierIds}`
}

function calculateItemPrice(basePrice, modifiers) {
  const modifiersPrice = modifiers.reduce((sum, modifier) => sum + (modifier.price || 0), 0)
  return basePrice + modifiersPrice
}

function calculateTotals(items, discount = 0) {
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount

  return {
    itemsCount,
    subtotal,
    discount,
    discountAmount,
    total: Math.max(0, total)
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Загрузка корзины из localStorage при инициализации
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartData })
      } catch (error) {
        console.error('Ошибка при загрузке корзины:', error)
        localStorage.removeItem('cart')
      }
    }
  }, [])

  // Сохранение корзины в localStorage при изменениях
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state))
  }, [state])

  // Добавление товара в корзину
  const addItem = (dish, modifiers = [], quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { dish, modifiers, quantity }
    })
    
    toast.success(`${dish.name} добавлено в корзину`, {
      duration: 2000,
    })
  }

  // Удаление товара из корзины
  const removeItem = (itemId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId })
    toast.success('Товар удален из корзины')
  }

  // Изменение количества товара
  const updateQuantity = (itemId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { itemId, quantity }
    })
  }

  // Очистка корзины
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    toast.success('Корзина очищена')
  }

  // Установка типа доставки
  const setDeliveryType = (type) => {
    dispatch({ type: 'SET_DELIVERY_TYPE', payload: type })
  }

  // Применение промокода
  const applyPromoCode = async (code) => {
    try {
      // Здесь будет API запрос для проверки промокода
      const response = await fetch(`/api/v1/promo-codes/${code}`)
      
      if (!response.ok) {
        throw new Error('Промокод не найден или недействителен')
      }

      const promoData = await response.json()
      
      dispatch({
        type: 'APPLY_PROMO_CODE',
        payload: {
          code,
          discount: promoData.discount
        }
      })

      toast.success(`Промокод применен! Скидка ${promoData.discount}%`)
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }

  // Удаление промокода
  const removePromoCode = () => {
    dispatch({ type: 'REMOVE_PROMO_CODE' })
    toast.success('Промокод отменен')
  }

  // Проверка, есть ли товар в корзине
  const isInCart = (dishId, modifiers = []) => {
    const itemId = generateItemId(dishId, modifiers)
    return state.items.some(item => item.id === itemId)
  }

  // Получение количества товара в корзине
  const getItemQuantity = (dishId, modifiers = []) => {
    const itemId = generateItemId(dishId, modifiers)
    const item = state.items.find(item => item.id === itemId)
    return item?.quantity || 0
  }

  const value = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setDeliveryType,
    applyPromoCode,
    removePromoCode,
    isInCart,
    getItemQuantity,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}