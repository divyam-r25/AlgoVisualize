import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 4 10 9 10-9" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loading } = useAuth();

  // Default to signup if ?mode=signup in URL (from "Get Started" button)
  const [mode, setMode] = useState(() => searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [formData, setFormData] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = field => e => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setSubmitting(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(formData.email, formData.password, formData.displayName);
      }
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '').replace(/\(.*\)/, '') || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  if (loading) {
    return (
      <div className="login-layout">
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div className="login-layout">
      {/* Theme toggle in corner */}
      <div className="login-theme-corner">
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDark ? <>☀️ Light</> : <>🌙 Dark</>}
        </button>
      </div>

      {/* Brand */}
      <div className="login-brand">
        <h1 className="login-brand-title">AlgoVisualize</h1>
        <p className="login-brand-sub">
          {mode === 'signin' ? 'Visualize algorithms across multiple languages' : 'Create an account to get started'}
        </p>
      </div>

      {/* Card */}
      <div className="login-card">
        <h2 className="login-card-heading">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h2>
        <p className="login-card-sub">
          {mode === 'signin'
            ? 'Enter your credentials to access your account'
            : 'Enter your information to create your account'}
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-field">
              <label className="form-label" htmlFor="displayName">Display Name</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><PersonIcon /></span>
                <input
                  id="displayName"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.displayName}
                  onChange={update('displayName')}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon"><MailIcon /></span>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={update('email')}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <div className="form-row-split" style={{ marginBottom: 6 }}>
              <label className="form-label" htmlFor="password">Password</label>
              {mode === 'signin' && (
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              )}
            </div>
            <div className="form-input-wrapper">
              <span className="form-input-icon"><LockIcon /></span>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={update('password')}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </div>
            {mode === 'signup' && (
              <p className="form-helper">Must be at least 6 characters long</p>
            )}
          </div>

          {mode === 'signup' && (
            <div className="form-field">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><LockIcon /></span>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={update('confirmPassword')}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: 4, padding: '11px 16px' }}
            disabled={submitting}
            id={mode === 'signin' ? 'signin-submit' : 'signup-submit'}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="login-divider">or continue with</div>

        <button className="google-btn" onClick={handleGoogle} disabled={submitting} id="google-signin">
          <GoogleIcon />
          Google
        </button>

        <p className="login-footer">
          {mode === 'signin' ? (
            <>Don't have an account? <a href="#" className="login-link" onClick={e => { e.preventDefault(); setMode('signup'); setError(''); }}>Sign up</a></>
          ) : (
            <>Already have an account? <a href="#" className="login-link" onClick={e => { e.preventDefault(); setMode('signin'); setError(''); }}>Sign in</a></>
          )}
        </p>
      </div>

      <p className="login-terms">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
