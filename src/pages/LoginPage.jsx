import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleSignIn } from '../components/authentication/GoogleSignIn';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/editor', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="login-page loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="logo-section">
            <h1 className="app-title">AlgoVisualize</h1>
            <p className="app-tagline">Learn algorithms through interactive visualization</p>
          </div>

          <div className="features-section">
            <h2>Why join AlgoVisualize?</h2>
            <ul className="features-list">
              <li>
                <span className="feature-icon">🎨</span>
                <span>Interactive algorithm visualization</span>
              </li>
              <li>
                <span className="feature-icon">🐍</span>
                <span>Multiple programming languages</span>
              </li>
              <li>
                <span className="feature-icon">📊</span>
                <span>Real-time performance metrics</span>
              </li>
              <li>
                <span className="feature-icon">💾</span>
                <span>Save and share your sessions</span>
              </li>
            </ul>
          </div>

          <div className="signin-section">
            <GoogleSignIn />
            <p className="terms">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
