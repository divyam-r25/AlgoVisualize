import { useExecutionContext } from '../../context/ExecutionContext';

export default function CallStackPanel() {
  const {
    state: { callStack = [] },
  } = useExecutionContext();

  const count = callStack.length;

  return (
    <div>
      <p className="bottom-panel-title">
        <span>≡</span> Call Stack
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '0 0 10px' }}>
        {count === 0
          ? 'No functions in stack'
          : `${count} function${count !== 1 ? 's' : ''} in stack`}
      </p>
      {count === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Call stack will appear during execution.
        </p>
      ) : (
        <div className="callstack-list">
          {callStack.map((frame, idx) => (
            <div key={idx} className="callstack-item">
              <div>
                <div className="callstack-name">
                  {frame.name || frame.functionName || 'anonymous'}
                </div>
                <div className="callstack-info">
                  {frame.line ? `Line ${frame.line}` : ''}
                  {frame.type ? ` • ${frame.type}` : ''}
                </div>
              </div>
              {idx === callStack.length - 1 && (
                <span className="callstack-badge">Current</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
