import { loadPyodide } from 'pyodide';

let pyodideReady = false;
let pyodide = null;

async function initPyodide() {
  if (pyodideReady && pyodide) {
    return pyodide;
  }

  try {
    pyodide = await loadPyodide();
    pyodideReady = true;
    return pyodide;
  } catch (err) {
    console.error('Failed to initialize Pyodide:', err);
    throw new Error('Failed to initialize Python runtime: ' + err.message);
  }
}

/**
 * Execute Python code and return execution state
 */
export async function executePython(code) {
  try {
    pyodide = await initPyodide();

    // Create a namespace for execution
    const namespace = pyodide.globals.get('dict')();
    const mainModule = pyodide.pyimport('__main__');

    // Execute the code
    pyodide.runPython(`
import sys
import traceback
from io import StringIO

_output_buffer = StringIO()
_error_buffer = StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = _output_buffer
sys.stderr = _error_buffer
    `, namespace);

    try {
      pyodide.runPython(code, namespace);
      sys.stdout = pyodide.pyimport('sys').stdout;

      const output = pyodide.runPython(
        '_output_buffer.getvalue()',
        namespace
      );

      return {
        success: true,
        output: output || '',
        error: null,
        variables: extractPythonVariables(namespace),
      };
    } catch (err) {
      const errorOutput = pyodide.runPython(
        '_error_buffer.getvalue()',
        namespace
      );

      return {
        success: false,
        output: '',
        error: err.message || 'Execution error',
        errorTrace: errorOutput || traceback.format_exc(),
        variables: extractPythonVariables(namespace),
      };
    }
  } catch (err) {
    return {
      success: false,
      output: '',
      error: 'Python runtime error: ' + err.message,
      variables: {},
    };
  }
}

/**
 * Extract variables from Python namespace
 */
function extractPythonVariables(namespace) {
  const variables = {};

  try {
    // Get all keys from the namespace
    const keys = namespace.keys();

    for (const key of keys) {
      if (key.startsWith('_')) continue; // Skip internal variables

      try {
        const value = namespace.get(key);
        // Convert Python objects to JavaScript-compatible format
        variables[key] = pythonToJS(value);
      } catch (e) {
        // Skip variables that can't be converted
      }
    }
  } catch (err) {
    console.warn('Failed to extract Python variables:', err);
  }

  return variables;
}

/**
 * Convert Python objects to JavaScript-compatible format
 */
function pythonToJS(pyValue) {
  try {
    // Pyodide provides a toJs() method for conversion
    if (pyValue && typeof pyValue.toJs === 'function') {
      return pyValue.toJs();
    }

    // Handle basic types
    if (pyValue === null || pyValue === undefined) {
      return null;
    }

    if (typeof pyValue === 'boolean' || typeof pyValue === 'number' || typeof pyValue === 'string') {
      return pyValue;
    }

    // Try JSON.stringify as fallback
    return JSON.stringify(pyValue);
  } catch (err) {
    return `<${typeof pyValue}>`;
  }
}

/**
 * Validate Python code for unsafe operations
 */
export function validatePythonCode(code) {
  const dangerousPatterns = [
    /import\s+os/i,
    /import\s+subprocess/i,
    /import\s+socket/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    /__import__/i,
  ];

  const errors = [];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      errors.push(`Unsafe operation detected: ${pattern.source}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
