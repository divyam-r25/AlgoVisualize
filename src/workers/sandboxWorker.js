import { createRuntime, stepRuntime } from "../services/executionEngine";

const INSTRUCTION_LIMIT = 25_000;
let runtime = null;
let executedInstructions = 0;

self.onmessage = (event) => {
  const { id, type, payload } = event.data ?? {};
  const post = (responseType, responsePayload = {}) => {
    self.postMessage({ id, type: responseType, payload: responsePayload });
  };

  try {
    switch (type) {
      case "init": {
        runtime = createRuntime(payload.compiledProgram);
        executedInstructions = 0;
        post("inited", { runtime });
        break;
      }
      case "executeInstruction": {
        if (!runtime) {
          throw new Error("Sandbox is not initialized.");
        }
        const steps = Math.max(1, Number(payload.steps ?? 1));
        const timeoutMs = Math.max(10, Number(payload.timeoutMs ?? 50));
        const startedAt = Date.now();
        const records = [];

        for (let index = 0; index < steps; index += 1) {
          if (runtime.terminated || runtime.error) {
            break;
          }
          if (executedInstructions >= INSTRUCTION_LIMIT) {
            throw new Error("Instruction budget exceeded.");
          }
          if (Date.now() - startedAt > timeoutMs) {
            throw new Error("Sandbox execution timeout.");
          }

          const step = stepRuntime(runtime);
          runtime = step.runtime;
          executedInstructions += 1;
          if (step.record) {
            records.push(step.record);
          }
        }

        post("executed", { runtime, records });
        break;
      }
      case "snapshot":
        post("snapshot", { runtime });
        break;
      case "terminate":
        runtime = null;
        post("terminated");
        self.close();
        break;
      default:
        throw new Error(`Unknown message type "${type}".`);
    }
  } catch (error) {
    post("error", { message: error.message });
  }
};
