import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
  };

  return (
    <header className="app-navbar">
      <Link to="/home" className="app-navbar-brand">AlgoVisualize</Link>
      <div className="app-navbar-right">
        {user && (
          <span className="app-navbar-username">
            {user.displayName || user.email?.split('@')[0]}
          </span>
        )}
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? (
            <>☀️ <span>Light</span></>
          ) : (
            <>🌙 <span>Dark</span></>
          )}
        </button>
        {user && (
          <button className="btn-outline" onClick={handleLogout}>
            ↪ Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
