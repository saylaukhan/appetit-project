import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const themes = {
  light: {
    name: 'light',
    colors: {
      primary: '#FF6B35',
      primaryDark: '#E85A2B',
      primaryLight: '#FFB99B',
      secondary: '#2D3436',
      secondaryLight: '#636E72',
      accent: '#00B894',
      accentDark: '#00A085',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      surfaceHover: '#F8F9FA',
      textPrimary: '#2D3436',
      textSecondary: '#636E72',
      textMuted: '#B2BEC3',
      textWhite: '#FFFFFF',
      borderColor: '#DDD',
      borderLight: '#EAEAEA',
      success: '#00B894',
      warning: '#FDCB6E',
      error: '#E17055',
      info: '#74B9FF',
    }
  },
  dark: {
    name: 'dark',
    colors: {
      primary: '#FF6B35',
      primaryDark: '#E85A2B',
      primaryLight: '#FFB99B',
      secondary: '#FFFFFF',
      secondaryLight: '#B2BEC3',
      accent: '#00B894',
      accentDark: '#00A085',
      background: '#1A1A1A',
      surface: '#2D3436',
      surfaceHover: '#636E72',
      textPrimary: '#FFFFFF',
      textSecondary: '#B2BEC3',
      textMuted: '#636E72',
      textWhite: '#FFFFFF',
      borderColor: '#636E72',
      borderLight: '#636E72',
      success: '#00B894',
      warning: '#FDCB6E',
      error: '#E17055',
      info: '#74B9FF',
    }
  }
}

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('light')

  // Загрузка темы из localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
    } else {
      // Определение системной темы
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setCurrentTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Применение темы к CSS переменным
  useEffect(() => {
    const theme = themes[currentTheme]
    const root = document.documentElement

    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      root.style.setProperty(`--${cssVar}`, value)
    })

    // Сохранение темы
    localStorage.setItem('theme', currentTheme)
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [currentTheme])

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName)
    }
  }

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    themes,
    toggleTheme,
    setTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}