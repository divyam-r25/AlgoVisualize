import { useMemo } from "react";
import { useExecutionContext } from "../../context/ExecutionContext";

export default function VariableInspector() {
  const {
    state: { variables },
  } = useExecutionContext();

  const variableEntries = useMemo(() => Object.entries(variables), [variables]);

  return (
    <section className="panel panel-variables">
      <header className="panel-header">
        <h2>Variable Inspector</h2>
      </header>
      {variableEntries.length === 0 ? (
        <p className="empty-state">No variables in current frame.</p>
      ) : (
        <ul className="data-list">
          {variableEntries.map(([name, value]) => (
            <li key={name}>
              <span>{name}</span>
              <code>{JSON.stringify(value)}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
