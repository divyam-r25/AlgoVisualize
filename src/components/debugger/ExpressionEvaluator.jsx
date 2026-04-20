import { useState } from 'react';
import { evaluateExpression, createScopeFromRuntime, isExpressionSafe } from '../../utils/safeEval';
import './DebuggerPanel.module.css';

export function ExpressionEvaluator({ variables = {}, stepNumber = 0 }) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scope = createScopeFromRuntime(variables);

  const evaluate = () => {
    if (!expression.trim()) {
      setError('Please enter an expression');
      setResult(null);
      return;
    }

    if (!isExpressionSafe(expression)) {
      setError('Expression contains potentially unsafe code');
      setResult(null);
      return;
    }

    const evalResult = evaluateExpression(expression, scope);
    if (evalResult.success) {
      setResult({
        expression: expression.trim(),
        value: evalResult.value,
        displayValue: formatValue(evalResult.value),
      });
      setError(null);
    } else {
      setError(evalResult.error);
      setResult(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      evaluate();
    }
  };

  return (
    <div className="expression-evaluator">
      <div className="eval-header">
        <h3>Evaluate Expression</h3>
        <span className="eval-step">(Step {stepNumber})</span>
      </div>

      <div className="eval-input-group">
        <input
          type="text"
          value={expression}
          onChange={(e) => {
            setExpression(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          placeholder="e.g., arr[i] + arr[j], sum / count"
          className="eval-input"
        />
        <button onClick={evaluate} className="eval-button">
          Evaluate
        </button>
      </div>

      {error && <div className="eval-error">{error}</div>}

      {result && (
        <div className="eval-result">
          <div className="eval-result-label">Result:</div>
          <div className="eval-result-value">
            <code>{result.displayValue}</code>
          </div>
        </div>
      )}

      <div className="eval-help">
        <small>
          Available: variables, array access (arr[i]), Math functions (Math.max, etc.)
        </small>
      </div>
    </div>
  );
}

function formatValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) {
    const truncated = value.length > 10 ? `${value.slice(0, 10).join(', ')}...` : value.join(', ');
    return `[${truncated}]`;
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
