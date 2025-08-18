import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  :root {
    /* Основная палитра APPETIT */
    --primary-color: #e94a4e;
    --primary-dark: #d13c40;
    --primary-light: #f5a5a8;
    
    --secondary-color: #2D3436;
    --secondary-light: #636E72;
    
    --accent-color: #00B894;
    --accent-dark: #00A085;
    
    --background: #FAFAFA;
    --surface: #FFFFFF;
    --surface-hover: #F8F9FA;
    
    --text-primary: #2D3436;
    --text-secondary: #636E72;
    --text-muted: #B2BEC3;
    --text-white: #FFFFFF;
    
    --border-color: #DDD;
    --border-light: #EAEAEA;
    
    --success: #00B894;
    --warning: #FDCB6E;
    --error: #E17055;
    --info: #74B9FF;
    
    /* Тени */
    --shadow-small: 0 2px 8px rgba(45, 52, 54, 0.08);
    --shadow-medium: 0 4px 16px rgba(45, 52, 54, 0.12);
    --shadow-large: 0 8px 32px rgba(45, 52, 54, 0.16);
    
    /* Радиусы */
    --radius-small: 4px;
    --radius-medium: 8px;
    --radius-large: 16px;
    --radius-xl: 24px;
    
    /* Размеры */
    --header-height: 80px;
    --sidebar-width: 280px;
    --max-width: 1200px;
    
    /* Отступы */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-2xl: 48px;
    
    /* Z-index */
    --z-dropdown: 100;
    --z-sticky: 200;
    --z-fixed: 300;
    --z-modal: 400;
    --z-toast: 500;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: 'TTHoves', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text-primary);
    background-color: var(--background);
    font-weight: 300;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Скрытие полос прокрутки */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--surface);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: var(--radius-small);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }

  /* Типографика */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: var(--spacing-md);
  }

  h1 {
    font-size: 2.5rem;
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  h2 {
    font-size: 2rem;
    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }

  h3 {
    font-size: 1.5rem;
    @media (max-width: 768px) {
      font-size: 1.25rem;
    }
  }

  p {
    margin-bottom: var(--spacing-md);
  }

  a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--primary-dark);
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    font-size: inherit;
    color: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  /* Общие утилитарные классы */
  .container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--spacing-md);

    @media (max-width: 768px) {
      padding: 0 var(--spacing-sm);
    }
  }

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Анимации */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease;
  }

  .animate-slide-up {
    animation: slideUp 0.4s ease;
  }

  /* Responsive брейкпоинты */
  @media (max-width: 1200px) {
    :root {
      --max-width: 100%;
    }
  }

  @media (max-width: 768px) {
    :root {
      --header-height: 60px;
      --sidebar-width: 100vw;
      --spacing-lg: 16px;
      --spacing-xl: 24px;
      --spacing-2xl: 32px;
    }
  }

  @media (max-width: 480px) {
    :root {
      --spacing-md: 12px;
      --spacing-lg: 16px;
      --spacing-xl: 20px;
    }
  }
`

export default GlobalStyles
