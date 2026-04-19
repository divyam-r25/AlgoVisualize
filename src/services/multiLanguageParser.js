import { parse } from 'acorn';
import * as walk from 'acorn-walk';

/**
 * JavaScript Parser - Uses Acorn
 */
export const jsParser = {
  name: 'JavaScript',
  parse(code) {
    try {
      return parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        locations: true,
      });
    } catch (error) {
      throw new Error(`JavaScript parse error: ${error.message}`);
    }
  },

  validate(ast) {
    const unsupported = [
      'ImportDeclaration',
      'ExportNamedDeclaration',
      'ExportDefaultDeclaration',
      'TryStatement',
      'ThrowStatement',
      'AwaitExpression',
      'YieldExpression',
    ];

    const violations = [];
    walk.full(ast, (node) => {
      if (unsupported.includes(node.type)) {
        violations.push({
          type: node.type,
          line: node.loc?.start?.line ?? 0,
          message: `Unsupported syntax: ${node.type}`,
        });
      }
    });

    return violations;
  },
};

/**
 * Python Parser - Simplified lexical analysis
 */
export const pythonParser = {
  name: 'Python',
  parse(code) {
    try {
      const lines = code.split('\n');
      const ast = {
        type: 'PythonProgram',
        body: [],
        lines,
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) continue;

        // Parse function definitions
        if (trimmed.startsWith('def ')) {
          ast.body.push({
            type: 'FunctionDef',
            name: trimmed.match(/def\s+(\w+)/)?.[1] || 'anonymous',
            line: i + 1,
          });
        }

        // Parse class definitions
        if (trimmed.startsWith('class ')) {
          ast.body.push({
            type: 'ClassDef',
            name: trimmed.match(/class\s+(\w+)/)?.[1] || 'Anonymous',
            line: i + 1,
          });
        }

        // Parse loops
        if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
          ast.body.push({
            type: 'Loop',
            line: i + 1,
            content: trimmed,
          });
        }

        // Parse conditionals
        if (trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else:')) {
          ast.body.push({
            type: 'Conditional',
            line: i + 1,
            content: trimmed,
          });
        }
      }

      return ast;
    } catch (error) {
      throw new Error(`Python parse error: ${error.message}`);
    }
  },

  validate(code) {
    const violations = [];

    // Check for common Python issues
    if (code.includes('\t') && code.includes('    ')) {
      violations.push({
        type: 'MixedIndentation',
        message: 'Mixed tabs and spaces in indentation',
      });
    }

    // Check for unmatched parentheses
    let parenCount = 0;
    for (const char of code) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
    }
    if (parenCount !== 0) {
      violations.push({
        type: 'UnmatchedParentheses',
        message: 'Unmatched parentheses',
      });
    }

    return violations;
  },
};

/**
 * Java Parser - Simplified lexical analysis
 */
export const javaParser = {
  name: 'Java',
  parse(code) {
    try {
      const ast = {
        type: 'JavaProgram',
        body: [],
        classes: [],
      };

      const lines = code.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('//')) continue;

        // Parse class definitions
        const classMatch = trimmed.match(/(?:public\s+)?class\s+(\w+)/);
        if (classMatch) {
          ast.classes.push({
            type: 'ClassDeclaration',
            name: classMatch[1],
            line: i + 1,
          });
        }

        // Parse method definitions
        const methodMatch = trimmed.match(/(?:public|private|protected)?\s+(?:static\s+)?(\w+)\s+(\w+)\s*\(/);
        if (methodMatch) {
          ast.body.push({
            type: 'MethodDeclaration',
            returnType: methodMatch[1],
            name: methodMatch[2],
            line: i + 1,
          });
        }

        // Parse loops
        if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
          ast.body.push({
            type: 'Loop',
            line: i + 1,
            content: trimmed,
          });
        }

        // Parse conditionals
        if (trimmed.startsWith('if ') || trimmed.startsWith('if (')) {
          ast.body.push({
            type: 'Conditional',
            line: i + 1,
            content: trimmed,
          });
        }
      }

      return ast;
    } catch (error) {
      throw new Error(`Java parse error: ${error.message}`);
    }
  },

  validate(code) {
    const violations = [];

    // Check for balanced braces
    let braceCount = 0;
    let bracketCount = 0;

    for (const char of code) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }

    if (braceCount !== 0) {
      violations.push({
        type: 'UnmatchedBraces',
        message: 'Unmatched braces',
      });
    }

    if (bracketCount !== 0) {
      violations.push({
        type: 'UnmatchedBrackets',
        message: 'Unmatched brackets',
      });
    }

    return violations;
  },
};

/**
 * C++ Parser - Simplified lexical analysis
 */
export const cppParser = {
  name: 'C++',
  parse(code) {
    try {
      const ast = {
        type: 'CppProgram',
        body: [],
        includes: [],
      };

      const lines = code.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('//')) continue;

        // Parse includes
        const includeMatch = trimmed.match(/#include\s+[<"]([^>"]+)[>"]/);
        if (includeMatch) {
          ast.includes.push({
            type: 'Include',
            library: includeMatch[1],
            line: i + 1,
          });
        }

        // Parse function definitions
        const funcMatch = trimmed.match(/(\w+)\s+(\w+)\s*\(/);
        if (funcMatch && !trimmed.startsWith('#')) {
          ast.body.push({
            type: 'FunctionDeclaration',
            returnType: funcMatch[1],
            name: funcMatch[2],
            line: i + 1,
          });
        }

        // Parse loops
        if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
          ast.body.push({
            type: 'Loop',
            line: i + 1,
            content: trimmed,
          });
        }

        // Parse conditionals
        if (trimmed.startsWith('if ') || trimmed.startsWith('if (')) {
          ast.body.push({
            type: 'Conditional',
            line: i + 1,
            content: trimmed,
          });
        }
      }

      return ast;
    } catch (error) {
      throw new Error(`C++ parse error: ${error.message}`);
    }
  },

  validate(code) {
    const violations = [];

    // Check for balanced braces and angle brackets
    let braceCount = 0;
    let angleCount = 0;
    let parenCount = 0;

    for (const char of code) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '<') angleCount++;
      if (char === '>') angleCount--;
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
    }

    if (braceCount !== 0) {
      violations.push({
        type: 'UnmatchedBraces',
        message: 'Unmatched braces',
      });
    }

    if (parenCount !== 0) {
      violations.push({
        type: 'UnmatchedParentheses',
        message: 'Unmatched parentheses',
      });
    }

    return violations;
  },
};

/**
 * Parser selector
 */
export const getParserForLanguage = (language) => {
  const parsers = {
    javascript: jsParser,
    python: pythonParser,
    java: javaParser,
    cpp: cppParser,
  };

  return parsers[language] || jsParser;
};

/**
 * Universal parse and validate
 */
export function parseAndValidateCode(code, language = 'javascript') {
  try {
    const parser = getParserForLanguage(language);
    const ast = parser.parse(code);
    const violations = parser.validate(language === 'javascript' ? ast : code);

    return {
      ast,
      violations,
      error: null,
    };
  } catch (error) {
    return {
      ast: null,
      violations: [],
      error: error.message,
    };
  }
}
