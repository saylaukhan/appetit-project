import React, { useState, useEffect } from 'react';
import styles from './Stories.module.css';

const STORY_ICONS = {
  'Готовим без свинины': '🐄',
  'Осторожно, мошенники!': '⚠️',
  'Нам 10 лет': '🎉',
  'Новинка Чак-чак': '🍯',
  'Новинка: Дала Барбекю': '🍖',
  'В напитках новинки': '🥤',
  'Чебуреки по-домашнему': '🥟'
};

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStories();
  }, []);
  
  const loadStories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/marketing/banners/featured');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки сторисов:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStoryClick = (story) => {
    console.log('Клик по сторис:', story.title);
    // Здесь можно добавить логику открытия сторис
  };
  
  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }
  
  if (stories.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.storiesContainer}>
      <div className={styles.storiesScroll}>
        {stories.map((story, index) => (
          <div
            key={story.id}
            className={`${styles.storyCard} ${styles[`story${index + 1}`]}`}
            onClick={() => handleStoryClick(story)}
          >
            <div className={styles.storyIcon}>
              {STORY_ICONS[story.title] || '📱'}
            </div>
            <div className={styles.storyText}>
              <h3>{story.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;