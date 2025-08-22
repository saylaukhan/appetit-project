import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { toast } from 'react-hot-toast'

const CartContext = createContext()

// Начальное состояние корзины
const initialState = {
  items: [],
  total: 0,
  itemsCount: 0,
  deliveryType: 'delivery', // 'delivery' или 'pickup'
  pickupAddress: null, // Выбранный адрес самовывоза
  promoCode: null,
  discount: 0,
  promoData: null,
}

// Reducer для управления корзиной
function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...action.payload,
      }

    case 'ADD_ITEM': {
      const { dish, modifiers = [], addons = [], quantity = 1 } = action.payload
      const itemId = generateItemId(dish.id, modifiers, addons)
      
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
        const itemPrice = calculateItemPrice(dish.price, modifiers, addons)
        const newItem = {
          id: itemId,
          dishId: dish.id,
          name: dish.name,
          image: dish.image,
          basePrice: dish.price,
          price: itemPrice,
          quantity,
          modifiers: modifiers || [],
          addons: addons || [],
          dish,
        }
        newItems = [...state.items, newItem]
      }

      const newState = {
        ...state,
        items: newItems,
        ...(state.promoData ? calculateTotalsWithPromo(newItems, state.promoData) : calculateTotals(newItems, state.discount))
      }

      return newState
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      return {
        ...state,
        items: newItems,
        ...(state.promoData ? calculateTotalsWithPromo(newItems, state.promoData) : calculateTotals(newItems, state.discount))
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
        ...(state.promoData ? calculateTotalsWithPromo(newItems, state.promoData) : calculateTotals(newItems, state.discount))
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
        // Сбрасываем адрес самовывоза при смене типа доставки
        pickupAddress: action.payload === 'pickup' ? state.pickupAddress : null,
      }

    case 'SET_PICKUP_ADDRESS':
      return {
        ...state,
        pickupAddress: action.payload,
      }

    case 'APPLY_PROMO_CODE': {
      const { code, discount, discountAmount, promoData } = action.payload
      const newState = {
        ...state,
        promoCode: code,
        discount,
        promoData,
        ...calculateTotalsWithPromo(state.items, promoData)
      }
      return newState
    }

    case 'REMOVE_PROMO_CODE':
      return {
        ...state,
        promoCode: null,
        discount: 0,
        promoData: null,
        ...calculateTotals(state.items, 0)
      }

    default:
      return state
  }
}

// Вспомогательные функции
function generateItemId(dishId, modifiers, addons = []) {
  const modifierIds = modifiers.map(m => m.id).sort().join('-')
  const addonIds = addons.map(a => `${a.id}:${a.quantity}`).sort().join('-')
  return `${dishId}_${modifierIds}_${addonIds}`
}

function calculateItemPrice(basePrice, modifiers, addons = []) {
  const modifiersPrice = modifiers.reduce((sum, modifier) => sum + (parseFloat(modifier.price) || 0), 0)
  const addonsPrice = addons.reduce((sum, addon) => sum + ((parseFloat(addon.price) || 0) * (addon.quantity || 1)), 0)
  const totalPrice = parseFloat(basePrice) + modifiersPrice + addonsPrice
  return Math.round(totalPrice * 100) / 100 // Округляем до 2 знаков
}

function calculateTotals(items, discount = 0) {
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount

  return {
    itemsCount,
    subtotal: Math.round(subtotal * 100) / 100, // Округляем до 2 знаков
    discount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    total: Math.round(Math.max(0, total) * 100) / 100
  }
}

function calculateTotalsWithPromo(items, promoData = null) {
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
  
  let discountAmount = 0
  let discount = 0
  
  if (promoData) {
    discountAmount = parseFloat(promoData.discount_amount) || 0
    discount = parseFloat(promoData.discount) || 0
  }
  
  const total = Math.max(0, subtotal - discountAmount)

  return {
    itemsCount,
    subtotal: Math.round(subtotal * 100) / 100,
    discount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    total: Math.round(total * 100) / 100
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
  const addItem = (dish, modifiers = [], addons = [], quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { dish, modifiers, addons, quantity }
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

  // Установка адреса самовывоза
  const setPickupAddress = (address) => {
    dispatch({ type: 'SET_PICKUP_ADDRESS', payload: address })
  }

  // Применение промокода
  const applyPromoCode = async (code) => {
    try {
      // Импортируем API
      const { promoAPI } = await import('../services/api')
      
      // Рассчитываем текущую сумму заказа
      const orderTotal = state.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
      
      // API запрос для применения промокода (увеличивает счетчик)
      const response = await promoAPI.applyPromo(code, orderTotal)
      const promoData = response.data
      
      dispatch({
        type: 'APPLY_PROMO_CODE',
        payload: {
          code: promoData.code,
          discount: promoData.discount,
          discountAmount: promoData.discount_amount,
          promoData: promoData
        }
      })

      toast.success(`Промокод применен! Скидка ${promoData.discount}%`)
      return true
    } catch (error) {
      console.error('Ошибка промокода:', error)
      
      // Обработка различных типов ошибок
      let errorMessage = 'Промокод не найден или недействителен'
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail[0]?.msg || 'Ошибка валидации'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      return false
    }
  }

  // Удаление промокода
  const removePromoCode = () => {
    dispatch({ type: 'REMOVE_PROMO_CODE' })
    toast.success('Промокод отменен')
  }

  // Проверка, есть ли товар в корзине
  const isInCart = (dishId, modifiers = [], addons = []) => {
    const itemId = generateItemId(dishId, modifiers, addons)
    return state.items.some(item => item.id === itemId)
  }

  // Получение количества товара в корзине
  const getItemQuantity = (dishId, modifiers = [], addons = []) => {
    const itemId = generateItemId(dishId, modifiers, addons)
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
    setPickupAddress,
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