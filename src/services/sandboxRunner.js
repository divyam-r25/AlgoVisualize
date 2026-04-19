export class SandboxRunner {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.requestId = 0;
  }

  init(compiledProgram) {
    if (!this.worker) {
      this.worker = new Worker(new URL("../workers/sandboxWorker.js", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (event) => this.onMessage(event.data);
    }
    return this.send("init", { compiledProgram });
  }

  executeInstruction(steps = 1, timeoutMs = 50) {
    return this.send("executeInstruction", { steps, timeoutMs });
  }

  snapshot() {
    return this.send("snapshot");
  }

  terminate() {
    if (!this.worker) {
      return Promise.resolve();
    }
    return this.send("terminate").finally(() => {
      this.worker = null;
      this.pending.clear();
    });
  }

  send(type, payload = {}) {
    if (!this.worker) {
      return Promise.reject(new Error("Sandbox worker is not initialized."));
    }
    const id = this.requestId;
    this.requestId += 1;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, expectedType: this.expectedResponseType(type) });
      this.worker.postMessage({ id, type, payload });
    });
  }

  expectedResponseType(type) {
    switch (type) {
      case "init":
        return "inited";
      case "executeInstruction":
        return "executed";
      case "snapshot":
        return "snapshot";
      case "terminate":
        return "terminated";
      default:
        return "unknown";
    }
  }

  onMessage(message) {
    const { id, type, payload } = message ?? {};
    const request = this.pending.get(id);
    if (!request) {
      return;
    }
    if (type === "error") {
      request.reject(new Error(payload?.message ?? "Sandbox error"));
      this.pending.delete(id);
      return;
    }
    if (type !== request.expectedType) {
      request.reject(
        new Error(`Unexpected worker response type "${type}" for request expecting "${request.expectedType}".`),
      );
      this.pending.delete(id);
      return;
    }

    request.resolve(payload);
    this.pending.delete(id);
  }
}
