import { useExecutionContext } from '../../context/ExecutionContext';

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export default function ExecutionControls() {
  const { state, actions } = useExecutionContext();
  const isRunning = state.executionStatus === 'running';
  const isIdle = state.executionStatus === 'idle';
  const isFinished = state.executionStatus === 'finished';
  const isPaused = state.executionStatus === 'paused';

  const statusLabel =
    isRunning ? 'Running' :
    isPaused ? 'Paused' :
    isFinished ? 'Finished' :
    state.executionStatus === 'error' ? 'Error' :
    'Idle';

  const statusClass =
    isRunning ? 'running' :
    isPaused ? 'paused' :
    isFinished ? 'finished' :
    state.executionStatus === 'error' ? 'error' :
    'idle';

  return (
    <div className="exec-controls">
      <p className="exec-controls-title">Execution Controls</p>

      {/* Run / Reset row */}
      <div className="exec-btn-row">
        {isRunning ? (
          <button
            className="btn btn-primary"
            onClick={actions.pause}
            id="exec-pause"
          >
            <PauseIcon /> Pause
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={actions.run}
            disabled={!!state.parseError || isFinished}
            id="exec-run"
          >
            <PlayIcon /> Run
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={actions.reset}
          id="exec-reset"
        >
          <ResetIcon /> Reset
        </button>
      </div>

      {/* Step Back / Step Forward */}
      <div className="exec-step-row">
        <button
          className="btn btn-ghost"
          onClick={actions.stepBackward}
          disabled={isRunning || state.currentStep === 0}
          id="exec-step-back"
          style={{ fontSize: 12 }}
        >
          ‹ Step Back
        </button>
        <button
          className="btn btn-ghost"
          onClick={actions.stepForward}
          disabled={isRunning || !!state.parseError || isFinished}
          id="exec-step-forward"
          style={{ fontSize: 12 }}
        >
          Step Forward ›
        </button>
      </div>

      {/* Status rows */}
      <div className="exec-status-rows">
        <div className="exec-status-row">
          <span className="exec-status-label">Status:</span>
          <span className={`exec-status-value ${statusClass}`}>{statusLabel}</span>
        </div>
        {state.currentLine > 0 && (
          <div className="exec-status-row">
            <span className="exec-status-label">Current Line:</span>
            <span className="exec-status-value">{state.currentLine}</span>
          </div>
        )}
        {state.totalSteps > 0 && (
          <div className="exec-status-row">
            <span className="exec-status-label">Step:</span>
            <span className="exec-status-value">
              {state.currentStep} / {state.totalSteps}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
