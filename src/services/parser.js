import { parse } from "acorn";
import * as walk from "acorn-walk";

const UNSUPPORTED_NODE_TYPES = new Set([
  "ImportDeclaration",
  "ExportNamedDeclaration",
  "ExportDefaultDeclaration",
  "ExportAllDeclaration",
  "AwaitExpression",
  "YieldExpression",
  "ClassDeclaration",
  "TryStatement",
  "ThrowStatement",
  "SwitchStatement",
  "DoWhileStatement",
  "WithStatement",
]);

export function parseCode(code) {
  return parse(code, {
    ecmaVersion: "latest",
    sourceType: "script",
    locations: true,
  });
}

export function validateAst(ast) {
  const violations = [];

  walk.full(ast, (node) => {
    if (UNSUPPORTED_NODE_TYPES.has(node.type)) {
      violations.push({
        type: node.type,
        line: node.loc?.start?.line ?? 0,
        column: node.loc?.start?.column ?? 0,
      });
    }
  });

  return violations;
}

export function parseAndValidate(code) {
  try {
    const ast = parseCode(code);
    const violations = validateAst(ast);

    if (violations.length > 0) {
      const first = violations[0];
      return {
        ast: null,
        error: `Unsupported syntax "${first.type}" at line ${first.line}, column ${first.column}.`,
      };
    }

    return { ast, error: null };
  } catch (error) {
    const line = error.loc?.line ?? 0;
    const column = error.loc?.column ?? 0;
    return {
      ast: null,
      error: `Parse error at line ${line}, column ${column}: ${error.message}`,
    };
  }
}
