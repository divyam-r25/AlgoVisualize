import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const FEATURE_CARDS = [
  {
    id: 'editor',
    icon: '</>',
    title: 'Code Editor',
    desc: 'Write and visualize algorithms with real-time execution',
    action: 'Open Editor',
    path: '/editor',
  },
  {
    id: 'history',
    icon: '↺',
    title: 'Execution History',
    desc: 'View and replay your previous algorithm executions',
    action: 'View History',
    path: '/history',
  },
  {
    id: 'profile',
    icon: '👤',
    title: 'Profile',
    desc: 'Manage your account settings and preferences',
    action: 'View Profile',
    path: '/profile',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  return (
    <main className="home-page">
      <div className="home-welcome">
        <h1>Welcome back, {displayName}</h1>
        <p>Choose an option below to get started</p>
      </div>

      <div className="home-cards">
        {FEATURE_CARDS.map(card => (
          <div key={card.id} className="home-card">
            <div className="home-card-icon">{card.icon}</div>
            <h2 className="home-card-title">{card.title}</h2>
            <p className="home-card-desc">{card.desc}</p>
            <button
              className="btn btn-secondary btn-full"
              onClick={() => navigate(card.path)}
              id={`home-card-${card.id}`}
            >
              {card.action}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
