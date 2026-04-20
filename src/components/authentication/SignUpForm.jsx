import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './AuthForm.css';

export function SignUpForm({ onSuccess }) {
  const { signUpWithEmail, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signUpWithEmail(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;
  const passwordsMatch = password === confirmPassword;
  const passwordStrength = password.length >= 8 ? 'strong' : password.length > 0 ? 'weak' : 'none';

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Create Account</h2>

      <div className="form-group">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          minLength="8"
        />
        <div className={`password-strength ${passwordStrength}`}>
          Password must be at least 8 characters
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="signup-confirm">Confirm Password</label>
        <input
          id="signup-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
        {password && !passwordsMatch && (
          <div className="error-text">Passwords do not match</div>
        )}
        {password && passwordsMatch && (
          <div className="success-text">Passwords match ✓</div>
        )}
      </div>

      {displayError && <div className="error-message">{displayError}</div>}

      <button
        type="submit"
        className="auth-button"
        disabled={loading || !email || !password || !confirmPassword || !passwordsMatch}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="terms-text">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}
