import { useExecutionContext } from '../../context/ExecutionContext';

export default function ExecutionMetricsPanel() {
  const { state } = useExecutionContext();

  const comparisons = state.comparisons ?? 0;
  const swaps = state.swaps ?? 0;
  const arrayAccesses = state.arrayAccesses ?? 0;
  const execTime = 0; // timing handled inside execution engine
  const recursionDepth = (state.callStack ?? []).length;


  return (
    <div>
      <p className="bottom-panel-title">
        <span>📈</span> Execution Metrics
      </p>

      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Comparisons</span>
          <span className="metric-value blue">{comparisons}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Swaps</span>
          <span className="metric-value green">{swaps}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Array Accesses</span>
          <span className="metric-value orange">{arrayAccesses}</span>
        </div>
      </div>

      <div className="metrics-time-row">
        <div className="metric-item">
          <span className="metric-label">Execution Time</span>
          <span className="metric-value purple">{execTime}ms</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Recursion Depth</span>
          <span className="metric-value red">{recursionDepth}</span>
        </div>
      </div>
    </div>
  );
}
