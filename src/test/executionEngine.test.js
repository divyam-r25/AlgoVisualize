import { describe, expect, it } from "vitest";
import {
  compileProgram,
  createRuntime,
  getInspectableState,
  replay,
  stepRuntime,
} from "../services/executionEngine";
import { parseAndValidate } from "../services/parser";

function compileCode(code) {
  const parsed = parseAndValidate(code);
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return compileProgram(parsed.ast);
}

function runUntilDone(compiled, limit = 1000) {
  let runtime = createRuntime(compiled);
  const trace = [];
  for (let i = 0; i < limit; i += 1) {
    if (runtime.terminated || runtime.error) {
      break;
    }
    const result = stepRuntime(runtime);
    runtime = result.runtime;
    if (result.record) {
      trace.push(result.record);
    }
  }
  return { runtime, trace };
}

describe("execution engine", () => {
  it("executes bubble sort deterministically", () => {
    const compiled = compileCode(`
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = 0; j < arr.length - i - 1; j += 1) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}
const arr = [5, 1, 4, 2];
bubbleSort(arr);
`);
    const result = runUntilDone(compiled, 1000);
    expect(result.runtime.error).toBeNull();
    expect(result.runtime.terminated).toBe(true);
    const inspectable = getInspectableState(result.runtime);
    expect(inspectable.variables.arr).toEqual([1, 2, 4, 5]);
    expect(inspectable.metrics.comparisons).toBeGreaterThan(0);
    expect(inspectable.metrics.arrayAccesses).toBeGreaterThan(0);
  });

  it("supports recursive calls and records call operations", () => {
    const compiled = compileCode(`
function fact(n) {
  if (n <= 1) {
    return 1;
  }
  const sub = fact(n - 1);
  return n * sub;
}
const out = fact(5);
`);
    const result = runUntilDone(compiled, 1000);
    expect(result.runtime.error).toBeNull();
    const inspectable = getInspectableState(result.runtime);
    expect(inspectable.variables.out).toBe(120);
    expect(result.trace.some((entry) => entry.operation.includes("Call fact"))).toBe(true);
  });

  it("replays to exact state at target step", () => {
    const code = `
function test(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === 9) return mid;
    if (arr[mid] < 9) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}
const arr = [1, 3, 5, 7, 9, 11];
const idx = test(arr);
`;
    const compiled = compileCode(code);
    const replayResult = replay(compiled, 20);
    expect(replayResult.stepRecords.length).toBeGreaterThan(0);
    expect(replayResult.runtime.error).toBeNull();
  });
});
