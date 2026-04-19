import { describe, expect, it } from "vitest";
import { createBaseState, executionReducer } from "../hooks/useExecution";
import { compileProgram, createRuntime } from "../services/executionEngine";
import { parseAndValidate } from "../services/parser";

function bootstrapState(code) {
  const parsed = parseAndValidate(code);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  const compiled = compileProgram(parsed.ast);
  const runtime = createRuntime(compiled);

  const seeded = executionReducer(createBaseState(), { type: "LOAD_CODE", payload: code });
  return executionReducer(seeded, {
    type: "PARSE_SUCCESS",
    payload: {
      ast: parsed.ast,
      compiledProgram: compiled,
      runtime,
      totalSteps: 120,
    },
  });
}

describe("execution reducer", () => {
  it("transitions to parse error state", () => {
    const state = executionReducer(createBaseState(), {
      type: "PARSE_ERROR",
      payload: "Parse error at line 1",
    });
    expect(state.executionStatus).toBe("error");
    expect(state.parseError).toContain("Parse error");
  });

  it("steps forward and backward deterministically", () => {
    const code = `
function add(a, b) {
  return a + b;
}
const result = add(1, 2);
`;
    const bootstrapped = bootstrapState(code);
    const afterStep1 = executionReducer(bootstrapped, {
      type: "STEP_FORWARD",
      payload: { respectBreakpoints: false },
    });
    const afterStep2 = executionReducer(afterStep1, {
      type: "STEP_FORWARD",
      payload: { respectBreakpoints: false },
    });
    const rewound = executionReducer(afterStep2, { type: "STEP_BACKWARD" });

    expect(afterStep2.currentStep).toBeGreaterThan(afterStep1.currentStep);
    expect(rewound.currentStep).toBe(afterStep1.currentStep);
    expect(rewound.traceLog.length).toBe(afterStep1.traceLog.length);
  });

  it("pauses on breakpoint while running", () => {
    const code = `
const arr = [3, 2, 1];
arr[0] = arr[1];
`;
    const bootstrapped = bootstrapState(code);
    const withBreakpoint = executionReducer(bootstrapped, {
      type: "TOGGLE_BREAKPOINT",
      payload: 2,
    });
    const running = executionReducer(withBreakpoint, { type: "RUN_START" });
    const paused = executionReducer(running, {
      type: "STEP_FORWARD",
      payload: { respectBreakpoints: true },
    });

    expect(paused.executionStatus).toBe("paused");
  });
});
