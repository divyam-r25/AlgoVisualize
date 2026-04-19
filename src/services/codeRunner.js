import { SandboxRunner } from "./sandboxRunner";

export function createCodeRunner() {
  const sandbox = new SandboxRunner();

  return {
    init(program) {
      return sandbox.init(program);
    },
    executeInstruction(instructionCount = 1, timeoutMs = 50) {
      return sandbox.executeInstruction(instructionCount, timeoutMs);
    },
    snapshot() {
      return sandbox.snapshot();
    },
    terminate() {
      return sandbox.terminate();
    },
  };
}
