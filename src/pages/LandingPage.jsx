import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

const FEATURES = [
  {
    title: 'Multi-Language',
    desc: 'Write and visualize algorithms in JavaScript, Python, Java, and C++',
  },
  {
    title: 'Dry Run Simulator',
    desc: 'Set breakpoints, inspect variables, and track execution step-by-step',
  },
  {
    title: 'Execution Metrics',
    desc: 'Monitor comparisons, swaps, time complexity, and performance',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, loading } = useAuth();

  // If already signed in, skip landing and go home
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="landing-page">
      {/* Theme toggle — top right */}
      <div className="landing-theme-corner">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <>☀️ <span>Light</span></> : <>🌙 <span>Dark</span></>}
        </button>
      </div>

      {/* Hero */}
      <div className="landing-hero">
        <h1 className="landing-title">AlgoVisualize</h1>
        <p className="landing-subtitle">
          A powerful platform for visualizing algorithms with multi-language support,
          real-time execution tracking, and advanced debugging capabilities.
        </p>

        <div className="landing-cta">
          <button
            id="landing-get-started"
            className="btn btn-primary"
            style={{ padding: '11px 32px', fontSize: 15 }}
            onClick={() => navigate('/login?mode=signup')}
          >
            Get Started
          </button>
          <button
            id="landing-sign-in"
            className="btn btn-secondary"
            style={{ padding: '11px 32px', fontSize: 15 }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="landing-features">
        {FEATURES.map(f => (
          <div key={f.title} className="landing-feature-card">
            <h3 className="landing-feature-title">{f.title}</h3>
            <p className="landing-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
