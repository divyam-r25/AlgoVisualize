import { describe, expect, it } from "vitest";
import { parseAndValidate } from "../services/parser";

describe("parser", () => {
  it("parses valid JavaScript source", () => {
    const result = parseAndValidate("const x = 1; function run(){ return x; } run();");
    expect(result.error).toBeNull();
    expect(result.ast).toBeTruthy();
  });

  it("reports line and column for syntax errors", () => {
    const result = parseAndValidate("function broken( {");
    expect(result.ast).toBeNull();
    expect(result.error).toContain("line");
    expect(result.error).toContain("column");
  });

  it("reports unsupported syntax with clear guidance", () => {
    const result = parseAndValidate("class Demo { constructor() {} }");
    expect(result.ast).toBeNull();
    expect(result.error).toContain('Unsupported syntax "ClassDeclaration"');
  });
});
