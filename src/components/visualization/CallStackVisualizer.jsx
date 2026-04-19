import { useExecutionContext } from "../../context/ExecutionContext";

export default function CallStackVisualizer() {
  const {
    state: { callStack },
  } = useExecutionContext();

  return (
    <section className="panel panel-callstack">
      <header className="panel-header">
        <h2>Call Stack</h2>
      </header>
      {callStack.length === 0 ? (
        <p className="empty-state">Stack is empty.</p>
      ) : (
        <ul className="stack-list">
          {callStack.map((frame, index) => (
            <li key={`${frame.funcName}-${index}`}>
              <div className="stack-title">
                <strong>{frame.funcName}</strong>
                <span>line {frame.line ?? "-"}</span>
              </div>
              <code>{JSON.stringify(frame.variables)}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
