import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './AuthForm.css';

export function SignInForm({ onSuccess }) {
  const { signInWithEmail, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await signInWithEmail(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Sign In</h2>

      <div className="form-group">
        <label htmlFor="signin-email">Email</label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="signin-password">Password</label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
        <button
          type="button"
          className="forgot-password-btn"
          onClick={() => setShowForgotPassword(true)}
          disabled={loading}
        >
          Forgot password?
        </button>
      </div>

      {displayError && <div className="error-message">{displayError}</div>}

      <button
        type="submit"
        className="auth-button"
        disabled={loading || !email || !password}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </form>
  );
}

function ForgotPasswordModal({ onClose }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
      setSuccess(true);
      setTimeout(onClose, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h3>Reset Password</h3>

        {success ? (
          <div className="success-message">
            Password reset email sent! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button
              type="submit"
              className="auth-button"
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
