import { useMemo } from "react";
import { parseAndValidate } from "../services/parser";
import { transpileToJS } from "../services/transpiler";

/**
 * useParser — parses code for the current language and returns an Acorn-compatible AST.
 *
 * For JavaScript: parse directly with Acorn.
 * For Python / Java / C++: transpile to equivalent JavaScript first,
 *   then parse the transpiled JS with Acorn — giving the execution engine
 *   a fully executable AST with real variable tracking, metrics, and visualization.
 */
export function useParser(code, language = "javascript") {
  return useMemo(() => {
    if (!code || !code.trim()) {
      return {
        ast: { type: "Program", body: [], sourceType: "script" },
        error: null,
      };
    }

    if (language === "javascript") {
      return parseAndValidate(code);
    }

    // ── Non-JS: transpile → parse as JavaScript
    let jsCode;
    try {
      jsCode = transpileToJS(code, language);
    } catch (transpileErr) {
      return {
        ast: null,
        error: `[${language} transpile error] ${transpileErr.message}`,
      };
    }

    if (!jsCode || !jsCode.trim()) {
      return {
        ast: { type: "Program", body: [], sourceType: "script" },
        error: null,
      };
    }

    const result = parseAndValidate(jsCode);
    if (result.error) {
      // Return the original error, but annotate it so the user knows what happened.
      // In dev, log the transpiled code so we can debug.
      if (import.meta.env.DEV) {
        console.group(`[transpiler] ${language} → JS`);
        console.log("Original:\n", code);
        console.log("Transpiled:\n", jsCode);
        console.error("Parse error:", result.error);
        console.groupEnd();
      }
      return {
        ast: null,
        error: `Could not transpile ${language} code. Check syntax. (${result.error})`,
      };
    }

    return result;
  }, [code, language]);
}
