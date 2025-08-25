import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Truck, Star, Users } from 'lucide-react'
import BannerDisplay from '../../components/common/BannerDisplay'
import styles from './HomePage.module.css'

function HomePage() {
  return (
    <div className={styles.homeContainer}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <img src="/src/assets/Logo EXTRA.png" alt="APPETIT" className={styles.mainLogo} />
          <h1>Вкусная еда с доставкой на дом</h1>
          <p>
            Заказывайте любимые блюда из нашего ресторана APPETIT. 
            Быстрая доставка, свежие ингредиенты, отличное качество!
          </p>
          <Link to="/menu" className={styles.ctaButton}>
            Смотреть меню
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Story Banner Cards */}
      <BannerDisplay position="featured" maxCount={8} />

      <section className={styles.featuresSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Почему выбирают нас</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className="icon">
                <Clock size={32} />
              </div>
              <h3>Быстрая доставка</h3>
              <p>
                Доставляем ваш заказ в течение 30-45 минут. 
                Следите за курьером в реальном времени.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className="icon">
                <Star size={32} />
              </div>
              <h3>Отличное качество</h3>
              <p>
                Используем только свежие ингредиенты и проверенные рецепты. 
                Каждое блюдо готовится с любовью.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className="icon">
                <Truck size={32} />
              </div>
              <h3>Бесплатная доставка</h3>
              <p>
                Бесплатная доставка при заказе от 3000 тенге. 
                Работаем по всему городу без выходных.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className="icon">
                <Users size={32} />
              </div>
              <h3>Довольные клиенты</h3>
              <p>
                Более 10 000 довольных клиентов доверяют нам. 
                Рейтинг 4.8 из 5 звезд в отзывах.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Цифры, которые говорят за нас</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className="number">15K+</div>
              <div className="label">Довольных клиентов</div>
            </div>
            <div className={styles.statCard}>
              <div className="number">50K+</div>
              <div className="label">Выполненных заказов</div>
            </div>
            <div className={styles.statCard}>
              <div className="number">30 мин</div>
              <div className="label">Среднее время доставки</div>
            </div>
            <div className={styles.statCard}>
              <div className="number">4.8★</div>
              <div className="label">Средний рейтинг</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage