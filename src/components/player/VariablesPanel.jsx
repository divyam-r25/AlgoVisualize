import { useExecutionContext } from '../../context/ExecutionContext';

function getVarType(value) {
  if (Array.isArray(value)) {
    const isNumArr = value.every(v => typeof v === 'number');
    return isNumArr ? 'number[]' : 'array';
  }
  switch (typeof value) {
    case 'number': return 'number';
    case 'string': return 'string';
    case 'boolean': return 'boolean';
    case 'object': return value === null ? 'null' : 'object';
    default: return 'unknown';
  }
}

function getTypeClass(type) {
  if (type === 'number') return 'var-type-number';
  if (type === 'string') return 'var-type-string';
  if (type === 'boolean') return 'var-type-boolean';
  if (type.includes('[]') || type === 'array') return 'var-type-array';
  if (type === 'object') return 'var-type-object';
  return 'var-type-other';
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

export default function VariablesPanel() {
  const {
    state: { variables },
  } = useExecutionContext();

  const entries = Object.entries(variables || {});
  const hasVars = entries.length > 0;

  return (
    <div className="vars-panel">
      <p className="vars-panel-header">
        <span aria-hidden="true">(x)</span> Variables
      </p>
      <p className="vars-panel-count">
        {hasVars ? `${entries.length} variable${entries.length !== 1 ? 's' : ''} in scope` : 'Run code to see variables'}
      </p>

      {!hasVars ? (
        <div className="vars-empty">
          <div className="vars-empty-icon">(x)</div>
          <p className="vars-empty-title">No variables to display</p>
          <p className="vars-empty-sub">Variables will appear here during execution</p>
        </div>
      ) : (
        <div className="vars-list">
          {entries.map(([name, value]) => {
            const type = getVarType(value);
            const typeClass = getTypeClass(type);
            return (
              <div key={name} className="var-item">
                <span className="var-name">{name}</span>
                <span className={`var-type-badge ${typeClass}`}>{type}</span>
                <span className="var-value">{formatValue(value)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
