import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Clock, MapPin, Instagram, Facebook, Mail } from 'lucide-react'
import styles from './Footer.module.css'

function Footer() {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <div className={styles.footerTop}>
          <div className={styles.footerSection}>
            <div className={styles.logo}>
              <img src="/assets/Logo APPETIT.png" alt="APPETIT" />
              <span>APPETIT</span>
            </div>
            <p>
              Ваша любимая доставка еды в городе. Быстро, вкусно и всегда свежо!
            </p>
            <div className={styles.socialLinks}>
              <a href="https://instagram.com/appetit" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com/appetit" target="_blank" rel="noopener noreferrer">
                <Facebook size={20} />
              </a>
              <a href="mailto:info@appetit.kz">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h3>Контакты</h3>
            <div className={styles.contactItem}>
              <Phone size={18} />
              <a href="tel:+77001234567">+7 (700) 123-45-67</a>
            </div>
            <div className={styles.contactItem}>
              <Clock size={18} />
              <span>Ежедневно с 9:00 до 23:00</span>
            </div>
            <div className={styles.contactItem}>
              <MapPin size={18} />
              <span>г. Алматы, ул. Абая 150/230</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={18} />
              <a href="mailto:info@appetit.kz">info@appetit.kz</a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h3>Меню</h3>
            <ul>
              <li><Link to="/menu?category=pizza" className={styles.footerLink}>Пицца</Link></li>
              <li><Link to="/menu?category=burgers" className={styles.footerLink}>Бургеры</Link></li>
              <li><Link to="/menu?category=sushi" className={styles.footerLink}>Суши</Link></li>
              <li><Link to="/menu?category=salads" className={styles.footerLink}>Салаты</Link></li>
              <li><Link to="/menu?category=soups" className={styles.footerLink}>Супы</Link></li>
              <li><Link to="/menu?category=desserts" className={styles.footerLink}>Десерты</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3>Информация</h3>
            <ul>
              <li><Link to="/about" className={styles.footerLink}>О компании</Link></li>
              <li><Link to="/delivery" className={styles.footerLink}>Доставка и оплата</Link></li>
              <li><Link to="/contacts" className={styles.footerLink}>Контакты</Link></li>
              <li><Link to="/privacy" className={styles.footerLink}>Политика конфиденциальности</Link></li>
              <li><Link to="/terms" className={styles.footerLink}>Пользовательское соглашение</Link></li>
              <li><Link to="/jobs" className={styles.footerLink}>Вакансии</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div>
            © 2024 APPETIT. Все права защищены.
          </div>
          <div>
            Разработано с ❤️ для вкусной еды
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer