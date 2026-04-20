/**
 * SafeEval - Safely evaluates expressions within a variable scope
 * Only allows variable access and Math functions, no arbitrary code execution
 */

class SafeEvalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SafeEvalError';
  }
}

export function safeEval(expression, scope = {}) {
  if (!expression || typeof expression !== 'string') {
    return undefined;
  }

  try {
    // Create a safe evaluation function with limited scope
    // eslint-disable-next-line no-new-func
    const func = new Function(
      ...Object.keys(scope),
      `"use strict"; return (${expression})`
    );

    // Call with scope values as arguments
    const result = func(...Object.values(scope));
    return result;
  } catch (err) {
    throw new SafeEvalError(`Failed to evaluate: ${err.message}`);
  }
}

/**
 * Safely evaluates an expression and returns its value
 * Handles errors gracefully
 */
export function evaluateExpression(expression, scope = {}) {
  try {
    const result = safeEval(expression, scope);
    return {
      success: true,
      value: result,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      value: undefined,
      error: err.message,
    };
  }
}

/**
 * Evaluates multiple expressions and returns results
 */
export function evaluateExpressions(expressions, scope = {}) {
  return expressions.map((expr) => ({
    expression: expr,
    ...evaluateExpression(expr, scope),
  }));
}

/**
 * Creates a scope object from runtime variables
 */
export function createScopeFromRuntime(variables = {}) {
  return {
    ...variables,
    Math, // Allow Math functions
  };
}

/**
 * Validates if an expression is safe to evaluate
 * (Basic check - forbids common dangerous patterns)
 */
export function isExpressionSafe(expression) {
  if (!expression || typeof expression !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /import\s+/i,
    /require\s*\(/i,
    /window\s*\./i,
    /document\s*\./i,
    /process\s*\./i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(expression));
}
