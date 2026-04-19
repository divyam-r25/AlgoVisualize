import { NavLink } from "react-router-dom";
import { useExecutionContext } from "../../context/ExecutionContext";
import { useAuth } from "../../hooks/useAuth";
import { LanguageSelectorButton } from "../ui/LanguageSelector";
import styles from "./Navbar.module.css";

function navClassName({ isActive }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export default function Navbar() {
  const {
    state: { executionStatus, currentStep, totalSteps },
  } = useExecutionContext();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <h1>Algorithm Visualizer</h1>
        <p>Deterministic execution, step-by-step state tracing</p>
      </div>

      <nav className="navbar-links">
        <NavLink to="/editor" className={navClassName}>
          Editor
        </NavLink>
        <NavLink to="/library" className={navClassName}>
          Library
        </NavLink>
        <NavLink to="/saved" className={navClassName}>
          Saved Sessions
        </NavLink>
      </nav>

      <div className={styles.navbarMiddle}>
        <LanguageSelectorButton />
      </div>

      <div className="navbar-status">
        <span className={`status-pill status-${executionStatus}`}>{executionStatus}</span>
        <span>
          Step {currentStep}/{totalSteps}
        </span>
      </div>

      {user && (
        <div className={styles.userSection}>
          <img
            src={user.photoURL || "https://via.placeholder.com/40"}
            alt={user.displayName}
            className={styles.userAvatar}
            title={user.email}
          />
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
