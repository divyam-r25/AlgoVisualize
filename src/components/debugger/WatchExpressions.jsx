import { useState } from 'react';
import { evaluateExpression, createScopeFromRuntime, isExpressionSafe } from '../../utils/safeEval';
import './DebuggerPanel.module.css';

export function WatchExpressions({ variables = {} }) {
  const [watches, setWatches] = useState([]);
  const [newExpression, setNewExpression] = useState('');
  const [error, setError] = useState(null);

  const scope = createScopeFromRuntime(variables);

  const addWatch = () => {
    if (!newExpression.trim()) {
      setError('Please enter an expression');
      return;
    }

    if (!isExpressionSafe(newExpression)) {
      setError('Expression contains potentially unsafe code');
      return;
    }

    const result = evaluateExpression(newExpression, scope);
    if (!result.success) {
      setError(result.error);
      return;
    }

    setWatches([...watches, { id: Date.now(), expression: newExpression.trim() }]);
    setNewExpression('');
    setError(null);
  };

  const removeWatch = (id) => {
    setWatches(watches.filter((w) => w.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addWatch();
    }
  };

  return (
    <div className="watch-expressions">
      <div className="watch-header">
        <h3>Watch Expressions</h3>
      </div>

      <div className="watch-input-group">
        <input
          type="text"
          value={newExpression}
          onChange={(e) => {
            setNewExpression(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          placeholder="e.g., arr[i], sum + 1, Math.max(...arr)"
          className="watch-input"
        />
        <button onClick={addWatch} className="watch-button">
          Add
        </button>
      </div>

      {error && <div className="watch-error">{error}</div>}

      <div className="watch-list">
        {watches.length === 0 ? (
          <p className="watch-empty">No watch expressions added</p>
        ) : (
          watches.map((watch) => (
            <WatchItem
              key={watch.id}
              watch={watch}
              scope={scope}
              onRemove={() => removeWatch(watch.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WatchItem({ watch, scope, onRemove }) {
  const result = evaluateExpression(watch.expression, scope);
  const displayValue = result.success ? formatValue(result.value) : result.error;
  const isError = !result.success;

  return (
    <div className="watch-item">
      <div className="watch-expr-name">
        <code>{watch.expression}</code>
      </div>
      <div className={`watch-value ${isError ? 'error' : ''}`}>
        <code>{displayValue}</code>
      </div>
      <button className="watch-remove" onClick={onRemove} title="Remove watch">
        ×
      </button>
    </div>
  );
}

function formatValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
