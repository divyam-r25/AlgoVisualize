/**
 * Multi-Language to JavaScript Transpiler
 *
 * Converts Python, Java, and C++ source code into semantically-equivalent
 * JavaScript that the existing execution engine can interpret.
 *
 * The engine understands JavaScript AST (Acorn-compatible), so we transpile
 * each language to JS source, then parse that with Acorn.
 *
 * Supports the algorithm patterns used in visualizations:
 *   - Variable declarations and assignments
 *   - For / while loops
 *   - If / else conditions
 *   - Array operations (index access, swap, length)
 *   - Basic arithmetic, comparison, and logical operators
 *   - Function definitions and calls
 *   - Return statements
 *   - print / System.out.println / cout → console.log
 */

// ─── Python → JavaScript ───────────────────────────────────────────────

/**
 * Converts Python indentation-based blocks to JS braces.
 * Handles: def, for, while, if/elif/else, return, print, variables,
 * tuple-swap, list operations, range(), len(), and comparisons.
 */
function transpilePythonToJS(code) {
  const lines = code.split('\n');
  const output = [];
  const indentStack = [0]; // stack of indentation levels

  function currentIndent() {
    return indentStack[indentStack.length - 1];
  }

  function getIndent(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  // Close blocks whose indentation is greater than current
  function closeBlocks(newIndent, output) {
    while (indentStack.length > 1 && currentIndent() > newIndent) {
      indentStack.pop();
      output.push('}');
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = getIndent(rawLine);
    closeBlocks(indent, output);

    // Check if we need to increase indent
    if (indent > currentIndent()) {
      indentStack.push(indent);
    }

    // ── Function definition
    // def bubble_sort(arr):
    const defMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
    if (defMatch) {
      const name = defMatch[1];
      const params = defMatch[2].trim();
      output.push(`function ${name}(${params}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // ── For loop with range
    // for i in range(n): / for i in range(0, n): / for i in range(0, n, 1):
    const forRangeMatch = trimmed.match(/^for\s+(\w+)\s+in\s+range\(([^)]+)\)\s*:/);
    if (forRangeMatch) {
      const varName = forRangeMatch[1];
      const args = forRangeMatch[2].split(',').map(s => s.trim());
      let start = '0', end, step = '1';
      if (args.length === 1) {
        end = transpilePyExpr(args[0]);
      } else if (args.length === 2) {
        start = transpilePyExpr(args[0]);
        end = transpilePyExpr(args[1]);
      } else {
        start = transpilePyExpr(args[0]);
        end = transpilePyExpr(args[1]);
        step = transpilePyExpr(args[2]);
      }
      const cmp = step.startsWith('-') ? '>' : '<';
      const op = step.startsWith('-') ? '-=' : '+=';
      const stepAbs = step.startsWith('-') ? step.slice(1) : step;
      const update = stepAbs === '1' ? (cmp === '<' ? `${varName}++` : `${varName}--`) : `${varName} ${op} ${stepAbs}`;
      output.push(`for (let ${varName} = ${start}; ${varName} ${cmp} ${end}; ${update}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // ── For loop over array (for x in arr:)
    const forInMatch = trimmed.match(/^for\s+(\w+)\s+in\s+(\w+)\s*:/);
    if (forInMatch) {
      const elem = forInMatch[1];
      const arr = forInMatch[2];
      output.push(`for (let __i_${elem} = 0; __i_${elem} < ${arr}.length; __i_${elem}++) {`);
      output.push(`  let ${elem} = ${arr}[__i_${elem}];`);
      indentStack.push(indent + 4);
      continue;
    }

    // ── While loop
    const whileMatch = trimmed.match(/^while\s+(.+)\s*:/);
    if (whileMatch) {
      output.push(`while (${transpilePyExpr(whileMatch[1])}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // ── If statement
    const ifMatch = trimmed.match(/^if\s+(.+)\s*:/);
    if (ifMatch) {
      output.push(`if (${transpilePyExpr(ifMatch[1])}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    // ── Elif
    const elifMatch = trimmed.match(/^elif\s+(.+)\s*:/);
    if (elifMatch) {
      output.push(`} else if (${transpilePyExpr(elifMatch[1])}) {`);
      // Don't push — same level
      continue;
    }

    // ── Else
    if (trimmed === 'else:') {
      output.push('} else {');
      continue;
    }

    // ── Return
    const returnMatch = trimmed.match(/^return\s+(.*)/);
    if (returnMatch) {
      output.push(`return ${transpilePyExpr(returnMatch[1])};`);
      continue;
    }

    // ── print(...)
    const printMatch = trimmed.match(/^print\s*\((.+)\)$/);
    if (printMatch) {
      output.push(`console.log(${transpilePyExpr(printMatch[1])});`);
      continue;
    }

    // ── Tuple swap: a, b = b, a  or  arr[i], arr[j] = arr[j], arr[i]
    const tupleSwapMatch = trimmed.match(/^(.+),\s*(.+)\s*=\s*(.+),\s*(.+)$/);
    if (tupleSwapMatch) {
      const [, lhs1, lhs2, rhs1, rhs2] = tupleSwapMatch;
      const l1 = transpilePyExpr(lhs1.trim());
      const l2 = transpilePyExpr(lhs2.trim());
      const r1 = transpilePyExpr(rhs1.trim());
      const r2 = transpilePyExpr(rhs2.trim());
      output.push(`{ const __t = ${r1}; ${l1} = ${r2}; ${l2} = __t; }`);
      continue;
    }

    // ── Assignment with type annotation: x: int = 5  or  x = expr
    const assignMatch = trimmed.match(/^(\w+)(?:\s*:\s*\w+)?\s*([+\-*/%]?=)\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const op = assignMatch[2];
      const val = transpilePyExpr(assignMatch[3]);
      // Check if this variable was declared already by looking at previous output
      const alreadyDeclared = output.some(l =>
        l.match(new RegExp(`(let|const|var)\\s+${varName}\\b`))
      );
      if (op === '=' && !alreadyDeclared) {
        output.push(`let ${varName} = ${val};`);
      } else {
        output.push(`${varName} ${op} ${val};`);
      }
      continue;
    }

    // ── Indexed assignment: arr[i] = val
    const indexedAssign = trimmed.match(/^(\w+)\[(.+)\]\s*([+\-*/%]?=)\s*(.+)$/);
    if (indexedAssign) {
      const [, arr, idx, op, val] = indexedAssign;
      output.push(`${arr}[${transpilePyExpr(idx)}] ${op} ${transpilePyExpr(val)};`);
      continue;
    }

    // ── Standalone call expression (e.g. bubble_sort(array))
    if (trimmed.match(/^\w+\s*\(.*\)$/) && !trimmed.includes('=')) {
      output.push(`${transpilePyExpr(trimmed)};`);
      continue;
    }
  }

  // Close any remaining open blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    output.push('}');
  }

  return output.join('\n');
}

function transpilePyExpr(expr) {
  if (!expr) return '';
  expr = expr.trim();

  // len(x) → x.length
  expr = expr.replace(/\blen\s*\((\w+)\)/g, '$1.length');
  // range(...) in isolation → (handled by for loop, skip)
  // True/False/None → true/false/null
  expr = expr.replace(/\bTrue\b/g, 'true');
  expr = expr.replace(/\bFalse\b/g, 'false');
  expr = expr.replace(/\bNone\b/g, 'null');
  // Python "and"/"or"/"not" → JS "&&"/"||"/"!"
  expr = expr.replace(/\band\b/g, '&&');
  expr = expr.replace(/\bor\b/g, '||');
  expr = expr.replace(/\bnot\b/g, '!');
  // Python != → JS !==  and == → JS ===
  expr = expr.replace(/!=/g, '!==');
  expr = expr.replace(/(?<![!<>=])={1}(?!=)/g, (m, offset, str) => {
    // Only replace standalone = that are not already ===, !==, <=, >=
    return m; // assignment is handled at statement level
  });
  expr = expr.replace(/==/g, '===');
  // // int(...), float(...) → Number(...)
  expr = expr.replace(/\bint\s*\(/g, 'Number(');
  expr = expr.replace(/\bfloat\s*\(/g, 'Number(');
  expr = expr.replace(/\bstr\s*\(/g, 'String(');
  // Python list literal [1, 2, 3] stays the same in JS
  // Python ** → Math.pow (simple case: a**b → Math.pow(a,b))
  expr = expr.replace(/(\w+)\s*\*\*\s*(\w+)/g, 'Math.pow($1,$2)');
  // Python // → Math.floor division
  expr = expr.replace(/(\w+)\s*\/\/\s*(\w+)/g, 'Math.floor($1 / $2)');

  return expr;
}

// ─── Java → JavaScript ─────────────────────────────────────────────────

/**
 * Extracts the body of public static void main(...) and flattens it to
 * top-level code so the execution engine's mainInstructions can run it.
 * Other methods are kept as-is.
 */
function preprocessJavaMain(code) {
  let processed = code;

  // ── Step 1: Strip outer class wrapper (keep content, remove class { ... })
  // Find "public class Foo {" or "class Foo {"
  const classStart = processed.search(/(?:public\s+)?class\s+\w+\s*\{/);
  if (classStart !== -1) {
    const classOpenIdx = processed.indexOf('{', classStart);
    if (classOpenIdx !== -1) {
      // Find matching closing brace of the class
      let depth = 1;
      let pos = classOpenIdx + 1;
      while (pos < processed.length && depth > 0) {
        if (processed[pos] === '{') depth++;
        else if (processed[pos] === '}') depth--;
        pos++;
      }
      // Get the class body (without outer braces)
      const classBody = processed.slice(classOpenIdx + 1, pos - 1);
      // Everything before class + class body + everything after class closing brace
      processed = processed.slice(0, classStart) + classBody + processed.slice(pos);
    }
  }

  // ── Step 2: Extract main() body and flatten to top-level
  const mainStart = processed.search(
    /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{/
  );
  if (mainStart === -1) return processed;

  let openIdx = processed.indexOf('{', mainStart);
  if (openIdx === -1) return processed;

  let depth = 1;
  let pos = openIdx + 1;
  while (pos < processed.length && depth > 0) {
    if (processed[pos] === '{') depth++;
    else if (processed[pos] === '}') depth--;
    pos++;
  }
  const mainBody = processed.slice(openIdx + 1, pos - 1);
  const withoutMain = processed.slice(0, mainStart) + processed.slice(pos);
  return withoutMain + '\n// --- main body ---\n' + mainBody;
}

function transpileJavaToJS(code) {
  // Pre-process: flatten main() so its body becomes top-level
  code = preprocessJavaMain(code);

  const lines = code.split('\n');
  const output = [];

  // Track declared JS variable names so we can redeclare with `let`
  const declaredVars = new Set();
  // Brace depth tracking to know when we exit a function body
  let braceDepth = 0;
  let inMainBody = false;  // true = we are inside main(), emit as top-level

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) { output.push(''); continue; }
    if (trimmed.startsWith('//')) { output.push(rawLine); continue; }
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('import ') || trimmed.startsWith('package ')) continue;

    // ── Class declaration → comment only
    if (trimmed.match(/^(?:public\s+)?class\s+\w+/)) {
      output.push('// ' + trimmed);
      // count opening brace if present
      if (trimmed.endsWith('{')) braceDepth++;
      continue;
    }

    // ── Count brace depth for ALL lines to track when we exit main() body
    // Count { and } chars in the raw line (handles for{, if{, etc.)
    const openBraces  = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;

    // ── Closing brace (standalone })
    if (trimmed === '}') {
      braceDepth += closeBraces - openBraces; // net = -1
      if (inMainBody && braceDepth <= 1) {
        // Exiting main body — no closing brace emitted (content is top-level)
        inMainBody = false;
        declaredVars.clear();
      } else {
        output.push('}');
      }
      continue;
    }

    // ── Method / function declaration
    // public static void bubbleSort(int[] arr) {
    // public static void main(String[] args) { → emit as top-level, no function wrapper
    const methodMatch = trimmed.match(
      /^(?:public\s+|private\s+|protected\s+)*(?:static\s+)?(?:\w+(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)\s*\{?$/
    );
    if (methodMatch && methodMatch[1] !== 'if' && methodMatch[1] !== 'for' && methodMatch[1] !== 'while') {
      const name = methodMatch[1];
      const rawParams = methodMatch[2];
      const hasBrace = trimmed.endsWith('{');

      if (name === 'main') {
        // main() body becomes top-level code
        inMainBody = true;
        braceDepth++;
        declaredVars.clear();
        output.push('// --- main ---');
      } else {
        const params = parseJavaParams(rawParams);
        output.push(`function ${name}(${params})${hasBrace ? ' {' : ''}`);
        braceDepth++;
        declaredVars.clear();
      }
      continue;
    }

    // ── For loop
    // for (int i = 0; i < n - 1; i++) {
    const forMatch = trimmed.match(/^for\s*\((.+)\)\s*\{?$/);
    if (forMatch) {
      const inner = forMatch[1];
      const jsFor = transpileJavaForHeader(inner, declaredVars);
      const hasBrace = trimmed.endsWith('{');
      output.push(`for (${jsFor})${hasBrace ? ' {' : ''}`);
      continue;
    }

    // ── While loop
    const whileMatch = trimmed.match(/^while\s*\((.+)\)\s*\{?$/);
    if (whileMatch) {
      const condition = transpileJavaExpr(whileMatch[1]);
      output.push(`while (${condition}) {`);
      continue;
    }

    // ── If / else if / else
    const ifMatch = trimmed.match(/^if\s*\((.+)\)\s*\{?$/);
    if (ifMatch) {
      output.push(`if (${transpileJavaExpr(ifMatch[1])}) {`);
      continue;
    }
    const elseIfMatch = trimmed.match(/^}\s*else\s+if\s*\((.+)\)\s*\{?$/);
    if (elseIfMatch) {
      output.push(`} else if (${transpileJavaExpr(elseIfMatch[1])}) {`);
      continue;
    }
    if (trimmed === '} else {' || trimmed === 'else {') {
      output.push('} else {');
      continue;
    }

    // ── Array declaration: int[] arr = {1,2,3};  OR  int[] arr = new int[n];
    // Must come BEFORE simple var declaration so int[] pattern takes priority
    const arrDeclMatch = trimmed.match(
      /^(?:int|long|double|float|String)\s*\[\]\s+(\w+)\s*=\s*(.+)\s*;$/
    );
    if (arrDeclMatch) {
      const name = arrDeclMatch[1];
      const initRaw = arrDeclMatch[2].trim();
      let init;
      const newArrMatch = initRaw.match(/new\s+\w+\[([^\]]+)\]/);
      if (newArrMatch) {
        init = `new Array(${transpileJavaExpr(newArrMatch[1])}).fill(0)`;
      } else if (initRaw.startsWith('{') && initRaw.endsWith('}')) {
        // {1, 2, 3} → [1, 2, 3]
        init = '[' + initRaw.slice(1, -1) + ']';
      } else {
        init = transpileJavaExpr(initRaw);
      }
      if (!declaredVars.has(name)) {
        declaredVars.add(name);
        output.push(`let ${name} = ${init};`);
      } else {
        output.push(`${name} = ${init};`);
      }
      continue;
    }

    // ── Variable declaration (simple, non-array)
    // int n = arr.length;  /  double x = 3.14;
    const varDeclMatch = trimmed.match(
      /^(?:int|long|double|float|boolean|char|String|var)\s+(\w+)\s*(?:=\s*(.+))?\s*;$/
    );
    if (varDeclMatch) {
      const name = varDeclMatch[1];
      const init = varDeclMatch[2] !== undefined ? transpileJavaExpr(varDeclMatch[2]) : 'undefined';
      if (!declaredVars.has(name)) {
        declaredVars.add(name);
        output.push(`let ${name} = ${init};`);
      } else {
        output.push(`${name} = ${init};`);
      }
      continue;
    }

    // ── System.out.println / System.out.print
    const printMatch = trimmed.match(/^System\.out\.println?\s*\((.+)\)\s*;$/);
    if (printMatch) {
      output.push(`console.log(${transpileJavaExpr(printMatch[1])});`);
      continue;
    }

    // ── Arrays.toString(arr) in console context
    const arrToStringMatch = trimmed.match(/^System\.out\.println?\s*\(Arrays\.toString\((\w+)\)\)\s*;$/);
    if (arrToStringMatch) {
      output.push(`console.log(${arrToStringMatch[1]}.join(', '));`);
      continue;
    }

    // ── Return statement
    const returnMatch = trimmed.match(/^return\s+(.*)\s*;$/);
    if (returnMatch) {
      output.push(`return ${transpileJavaExpr(returnMatch[1])};`);
      continue;
    }

    // ── Simple increment/decrement (i++, i--, ++i, --i)
    if (trimmed.match(/^(?:\+\+|--)\w+\s*;$/) || trimmed.match(/^\w+\s*(?:\+\+|--)\s*;$/)) {
      output.push(trimmed);
      continue;
    }

    // ── Assignment / compound-assignment
    // arr[j] = arr[j + 1];  / temp = arr[j];  / x += 1;
    const assignMatch = trimmed.match(/^(.+?)\s*([+\-*/%]?=)\s*(.+)\s*;$/);
    if (assignMatch) {
      const lhs = transpileJavaExpr(assignMatch[1].trim());
      const op = assignMatch[2];
      const rhs = transpileJavaExpr(assignMatch[3].trim());
      output.push(`${lhs} ${op} ${rhs};`);
      continue;
    }

    // ── Standalone call (e.g. bubbleSort(array);)
    const callMatch = trimmed.match(/^(\w+\s*\(.*\))\s*;$/);
    if (callMatch) {
      output.push(`${transpileJavaExpr(callMatch[1])};`);
      continue;
    }

    // ── Pass-through for anything we didn't recognize
    output.push(rawLine);
  }

  return output.join('\n');
}

function parseJavaParams(rawParams) {
  if (!rawParams.trim()) return '';
  return rawParams.split(',').map(p => {
    const parts = p.trim().split(/\s+/);
    return parts[parts.length - 1]; // take just the variable name, drop type
  }).join(', ');
}

function transpileJavaForHeader(inner, declaredVars) {
  // int i = 0; i < n - 1; i++
  const parts = inner.split(';').map(s => s.trim());
  if (parts.length !== 3) return inner;

  let init = parts[0];
  const cond = transpileJavaExpr(parts[1]);
  const update = transpileJavaExpr(parts[2]);

  // Strip type from init: "int i = 0" → "let i = 0"
  const initMatch = init.match(/^(?:int|long|double|float|var)\s+(\w+)\s*=\s*(.+)$/);
  if (initMatch) {
    const name = initMatch[1];
    const val = transpileJavaExpr(initMatch[2]);
    if (!declaredVars.has(name)) {
      declaredVars.add(name);
      init = `let ${name} = ${val}`;
    } else {
      init = `${name} = ${val}`;
    }
  } else {
    init = transpileJavaExpr(init);
  }

  return `${init}; ${cond}; ${update}`;
}

function transpileJavaExpr(expr) {
  if (!expr) return '';
  expr = expr.trim();
  // Remove Java casts: (int), (long), (double), etc.
  expr = expr.replace(/\(\s*(?:int|long|double|float|char|byte)\s*\)/g, '');
  // Java != and == for primitives → !== and ===
  // Only replace bare == (not already === or !==)
  expr = expr.replace(/([^!<>=])==/g, '$1===');
  expr = expr.replace(/([^!<>=])!=/g, '$1!==');
  // Arrays.sort → sort by value
  expr = expr.replace(/Arrays\.sort\((\w+)\)/g, '$1.sort((a, b) => a - b)');
  // arr.length stays the same
  return expr;
}

// ─── C++ → JavaScript ──────────────────────────────────────────────────

/**
 * Extracts int main() body and flattens it to top-level code.
 */
function preprocessCppMain(code) {
  const mainStart = code.search(/\bint\s+main\s*\([^)]*\)\s*\{/);
  if (mainStart === -1) return code;

  let openIdx = code.indexOf('{', mainStart);
  if (openIdx === -1) return code;

  let depth = 1;
  let pos = openIdx + 1;
  while (pos < code.length && depth > 0) {
    if (code[pos] === '{') depth++;
    else if (code[pos] === '}') depth--;
    pos++;
  }
  // Strip return 0 / return; from the main body — invalid at JS top-level
  const mainBody = code.slice(openIdx + 1, pos - 1)
    .replace(/\breturn\s+0\s*;/g, '// return 0')
    .replace(/\breturn\s*;/g, '// return');

  const withoutMain = code.slice(0, mainStart) + code.slice(pos);
  return withoutMain + '\n// --- main body ---\n' + mainBody;
}

function transpileCppToJS(code) {
  // Pre-process: flatten main() body to top-level
  code = preprocessCppMain(code);

  const lines = code.split('\n');
  const output = [];
  const declaredVars = new Set();
  let braceDepth = 0;
  let inMainBody = false; // when true, emit main body as top-level code

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) { output.push(''); continue; }
    // Skip preprocessor / include / using
    if (trimmed.startsWith('#') || trimmed.startsWith('using ')) continue;
    if (trimmed.startsWith('//')) { output.push(rawLine); continue; }

    // ── Closing brace
    if (trimmed === '}') {
      braceDepth--;
      if (inMainBody && braceDepth <= 0) {
        inMainBody = false;
        declaredVars.clear();
        // No closing brace emitted (top-level)
      } else {
        output.push('}');
      }
      continue;
    }

    // ── Function definition
    // void bubbleSort(vector<int>& arr) {
    // int main() {  → inline body as top-level
    const funcMatch = trimmed.match(
      /^(?:void|int|long|double|float|bool|auto|std::\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{?$/
    );
    if (funcMatch && funcMatch[1] !== 'if' && funcMatch[1] !== 'for' && funcMatch[1] !== 'while') {
      const name = funcMatch[1];
      const rawParams = funcMatch[2];
      const hasBrace = trimmed.endsWith('{');

      if (name === 'main') {
        inMainBody = true;
        if (hasBrace) braceDepth++;
        declaredVars.clear();
        output.push('// --- main ---');
      } else {
        const params = parseCppParams(rawParams);
        output.push(`function ${name}(${params})${hasBrace ? ' {' : ''}`);
        if (hasBrace) braceDepth++;
        declaredVars.clear();
      }
      continue;
    }

    // ── For loop
    const forMatch = trimmed.match(/^for\s*\((.+)\)\s*\{?$/);
    if (forMatch) {
      const inner = forMatch[1];
      const jsFor = transpileCppForHeader(inner, declaredVars);
      const hasBrace = trimmed.endsWith('{');
      output.push(`for (${jsFor})${hasBrace ? ' {' : ''}`);
      continue;
    }

    // ── While loop
    const whileMatch = trimmed.match(/^while\s*\((.+)\)\s*\{?$/);
    if (whileMatch) {
      output.push(`while (${transpileCppExpr(whileMatch[1])}) {`);
      continue;
    }

    // ── If / else if / else
    const ifMatch = trimmed.match(/^if\s*\((.+)\)\s*\{?$/);
    if (ifMatch) {
      output.push(`if (${transpileCppExpr(ifMatch[1])}) {`);
      continue;
    }
    const elseIfMatch = trimmed.match(/^}\s*else\s+if\s*\((.+)\)\s*\{?$/);
    if (elseIfMatch) {
      output.push(`} else if (${transpileCppExpr(elseIfMatch[1])}) {`);
      continue;
    }
    if (trimmed === '} else {' || trimmed === 'else {') {
      output.push('} else {');
      continue;
    }

    // ── Variable declaration
    // int n = arr.size();  / int temp = arr[j];
    const varDeclMatch = trimmed.match(
      /^(?:int|long|double|float|bool|auto|char|size_t)\s+(\w+)\s*(?:=\s*(.+))?\s*;$/
    );
    if (varDeclMatch) {
      const name = varDeclMatch[1];
      const initRaw = varDeclMatch[2] !== undefined ? varDeclMatch[2] : '0';
      const init = transpileCppExpr(initRaw);
      if (!declaredVars.has(name)) {
        declaredVars.add(name);
        output.push(`let ${name} = ${init};`);
      } else {
        output.push(`${name} = ${init};`);
      }
      continue;
    }

    // ── vector<int> arr = {1,2,3};
    const vectorDeclMatch = trimmed.match(
      /^(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*(?:=\s*\{([^}]*)\})?\s*;$/
    );
    if (vectorDeclMatch) {
      const name = vectorDeclMatch[1];
      const items = vectorDeclMatch[2] || '';
      const init = `[${items}]`;
      if (!declaredVars.has(name)) {
        declaredVars.add(name);
        output.push(`let ${name} = ${init};`);
      } else {
        output.push(`${name} = ${init};`);
      }
      continue;
    }

    // ── std::swap(arr[j], arr[j+1])
    const swapMatch = trimmed.match(/^(?:std::)?swap\s*\((.+),\s*(.+)\)\s*;$/);
    if (swapMatch) {
      const a = transpileCppExpr(swapMatch[1].trim());
      const b = transpileCppExpr(swapMatch[2].trim());
      output.push(`{ let __t = ${a}; ${a} = ${b}; ${b} = __t; }`);
      continue;
    }

    // ── cout
    const coutMatch = trimmed.match(/^(?:std::)?cout\s*<<\s*(.+)(?:<<\s*(?:std::)?endl|\\n)?\s*;?$/);
    if (coutMatch) {
      const args = coutMatch[1].split('<<').map(s => transpileCppExpr(s.trim())).join(', ');
      output.push(`console.log(${args});`);
      continue;
    }

    // ── Return statement
    const returnMatch = trimmed.match(/^return\s*(.*?)\s*;$/);
    if (returnMatch) {
      const val = returnMatch[1];
      if (val === '0' || val === '') {
        output.push(`return;`); // void / main return 0
      } else {
        output.push(`return ${transpileCppExpr(val)};`);
      }
      continue;
    }

    // ── Simple increment/decrement
    if (trimmed.match(/^(?:\+\+|--)\w+\s*;?$/) || trimmed.match(/^\w+(?:\[.+\])?\s*(?:\+\+|--)\s*;?$/)) {
      output.push(trimmed.replace(/;?\s*$/, ';'));
      continue;
    }

    // ── Assignment / compound-assignment
    const assignMatch = trimmed.match(/^(.+?)\s*([+\-*/%]?=)\s*(.+?)\s*;$/);
    if (assignMatch) {
      const lhs = transpileCppExpr(assignMatch[1].trim());
      const op = assignMatch[2];
      const rhs = transpileCppExpr(assignMatch[3].trim());
      output.push(`${lhs} ${op} ${rhs};`);
      continue;
    }

    // ── Standalone function call
    const callMatch = trimmed.match(/^(\w+\s*\(.*\))\s*;$/);
    if (callMatch) {
      output.push(`${transpileCppExpr(callMatch[1])};`);
      continue;
    }

    // Pass through
    output.push(rawLine);
  }

  return output.join('\n');
}

function parseCppParams(rawParams) {
  if (!rawParams.trim()) return '';
  return rawParams.split(',').map(p => {
    // "vector<int>& arr" → "arr", "int n" → "n"
    const cleaned = p.trim()
      .replace(/(?:const\s+)?(?:std::)?(?:vector|array)\s*<[^>]+>\s*[&*]?\s*/g, '')
      .replace(/(?:int|long|double|float|bool|char|size_t)\s*[&*]?\s*/g, '')
      .trim();
    return cleaned || p.trim().split(/\s+/).pop();
  }).join(', ');
}

function transpileCppForHeader(inner, declaredVars) {
  const parts = inner.split(';').map(s => s.trim());
  if (parts.length !== 3) return inner;

  let init = parts[0];
  const cond = transpileCppExpr(parts[1]);
  const update = transpileCppExpr(parts[2]);

  const initMatch = init.match(/^(?:int|long|double|float|size_t|auto)\s+(\w+)\s*=\s*(.+)$/);
  if (initMatch) {
    const name = initMatch[1];
    const val = transpileCppExpr(initMatch[2]);
    if (!declaredVars.has(name)) {
      declaredVars.add(name);
      init = `let ${name} = ${val}`;
    } else {
      init = `${name} = ${val}`;
    }
  } else {
    init = transpileCppExpr(init);
  }

  return `${init}; ${cond}; ${update}`;
}

function transpileCppExpr(expr) {
  if (!expr) return '';
  expr = expr.trim();
  // arr.size() → arr.length
  expr = expr.replace(/\.size\(\)/g, '.length');
  // static_cast<type>(x) → Number(x)
  expr = expr.replace(/static_cast\s*<\s*\w+\s*>\s*\(([^)]+)\)/g, 'Number($1)');
  // Remove C++ casts: (int), (double), etc.
  expr = expr.replace(/\(\s*(?:int|long|double|float|char)\s*\)/g, '');
  // std::endl → "\n"
  expr = expr.replace(/(?:std::)?endl/g, '"\\n"');
  // Fix == and != (not already ===, !==)
  expr = expr.replace(/([^!<>=])==(?!=)/g, '$1===');
  expr = expr.replace(/([^!<>=])!=(?!=)/g, '$1!==');
  return expr;
}

// ─── Main transpiler export ─────────────────────────────────────────────

/**
 * Transpile source code from the given language to JavaScript.
 * Returns the equivalent JS string that the execution engine can parse/run.
 */
export function transpileToJS(code, language) {
  switch (language) {
    case 'python':
      return transpilePythonToJS(code);
    case 'java':
      return transpileJavaToJS(code);
    case 'cpp':
      return transpileCppToJS(code);
    case 'javascript':
      return code; // no-op
    default:
      return code;
  }
}
