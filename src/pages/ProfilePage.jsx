import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const joinedDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={displayName} referrerPolicy="no-referrer" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <h1 className="profile-name">{displayName}</h1>
        <p className="profile-email">{user?.email}</p>
        {joinedDate && <p className="profile-joined">Member since {joinedDate}</p>}
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Account Settings</h2>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/editor')}
          id="profile-go-editor"
        >
          Open Code Editor
        </button>
      </div>

      <div className="profile-section profile-danger">
        <h2 className="profile-section-title">Sign Out</h2>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          You'll be signed out of AlgoVisualize on this device.
        </p>
        <button className="btn btn-danger" onClick={handleLogout} id="profile-signout">
          Sign Out
        </button>
      </div>
    </main>
  );
}
