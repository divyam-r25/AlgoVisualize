import { NavLink } from "react-router-dom";
import { useExecutionContext } from "../../context/ExecutionContext";

function navClassName({ isActive }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export default function Navbar() {
  const {
    state: { executionStatus, currentStep, totalSteps },
  } = useExecutionContext();

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

      <div className="navbar-status">
        <span className={`status-pill status-${executionStatus}`}>{executionStatus}</span>
        <span>
          Step {currentStep}/{totalSteps}
        </span>
      </div>
    </header>
  );
}
