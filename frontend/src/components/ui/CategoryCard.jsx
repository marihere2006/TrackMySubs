import { Link } from 'react-router-dom';
import { LayoutGrid, Play, Music, Briefcase, ShoppingCart, Cloud, Gamepad2, BookOpen, Bot } from 'lucide-react';
import styles from './CategoryCard.module.css';

const getCategoryIcon = (category) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('streaming') || normalized.includes('video')) return Play;
  if (normalized.includes('music')) return Music;
  if (normalized.includes('productivity') || normalized.includes('work')) return Briefcase;
  if (normalized.includes('shopping')) return ShoppingCart;
  if (normalized.includes('cloud') || normalized.includes('storage')) return Cloud;
  if (normalized.includes('game') || normalized.includes('gaming')) return Gamepad2;
  if (normalized.includes('read') || normalized.includes('news')) return BookOpen;
  if (normalized.includes('ai') || normalized.includes('tool')) return Bot;
  return LayoutGrid; // fallback
};

const CategoryCard = ({ category, count, delay = 0 }) => {
  const Icon = getCategoryIcon(category);

  return (
    <Link 
      to={`/subscriptions?category=${encodeURIComponent(category)}`}
      className={`${styles.card} animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.iconWrap}>
        <Icon size={20} className={styles.icon} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{category}</h3>
        <p className={styles.count}>
          {count} subscription{count !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;
