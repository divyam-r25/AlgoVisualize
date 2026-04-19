import { useExecutionContext } from "../../context/ExecutionContext";

export default function TraceOutput() {
  const {
    state: { traceLog, currentStep },
  } = useExecutionContext();

  return (
    <section className="panel panel-trace">
      <header className="panel-header">
        <h2>Execution Trace</h2>
      </header>
      {traceLog.length === 0 ? (
        <p className="empty-state">No executed steps yet.</p>
      ) : (
        <ol className="trace-list">
          {traceLog.map((entry, index) => (
            <li key={entry.stepId} className={index + 1 === currentStep ? "trace-active" : ""}>
              <span>Line {entry.line}</span>
              <span>{entry.operation}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
