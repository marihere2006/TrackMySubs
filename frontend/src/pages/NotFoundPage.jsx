import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <FileQuestion size={64} className={styles.icon} />
        </div>
        <h1 className={styles.title}>404 - Page Not Found</h1>
        <p className={styles.description}>
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Link to="/dashboard">
            <Button variant="primary" icon={ArrowLeft} size="lg">
              Back To Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
