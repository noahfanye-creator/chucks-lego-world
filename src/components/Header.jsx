import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? 'active' : '';
  
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Market Notes
        </Link>
        
        <nav className="nav">
          <Link to="/" className={isActive('/')}>首页</Link>
          <Link to="/premarket" className={isActive('/premarket')}>盘前</Link>
          <Link to="/intraday" className={isActive('/intraday')}>盘中</Link>
          <Link to="/postmarket" className={isActive('/postmarket')}>盘后</Link>
          <Link to="/archive" className={isActive('/archive')}>归档</Link>
          <Link to="/about" className={isActive('/about')}>关于</Link>
        </nav>
      </div>
    </header>
  );
}
