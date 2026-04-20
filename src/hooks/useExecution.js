import { useCallback, useEffect, useReducer } from "react";
import { DEFAULT_ALGORITHM } from "../services/algorithms/library";
import {
  compileProgram,
  createRuntime,
  estimateTotalSteps,
  getCurrentLine,
  getInspectableState,
  getNearestSnapshotStep,
  replay,
  stepRuntime,
} from "../services/executionEngine";
import { useParser } from "./useParser";
import { useLanguage } from "./useLanguage";

const SNAPSHOT_INTERVAL = 10;
const MIN_SPEED = 0.25;
const MAX_SPEED = 2;

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function createBaseState() {
  return {
    code: DEFAULT_ALGORITHM.code,
    ast: null,
    parseError: null,
    compiledProgram: null,

    executionStatus: "idle",
    currentStep: 0,
    totalSteps: 0,
    historyCursor: 0,

    variables: {},
    callStack: [],
    heapObjects: {},
    traceLog: [],
    currentOperation: "",
    currentLine: null,

    breakpoints: new Set(),

    comparisons: 0,
    swaps: 0,
    arrayAccesses: 0,

    highlightedIndices: [],
    highlightedEdges: [],

    speed: 1,
    error: null,

    runtime: null,
    snapshots: {},
    pendingRestoreSteps: null,
    selectedAlgorithmId: DEFAULT_ALGORITHM.id,
  };
}

function hydrateFromRuntime(runtime) {
  if (!runtime) {
    return {
      variables: {},
      callStack: [],
      comparisons: 0,
      swaps: 0,
      arrayAccesses: 0,
      highlightedIndices: [],
      currentOperation: "",
      currentLine: null,
    };
  }

  const inspectable = getInspectableState(runtime);
  return {
    variables: inspectable.variables,
    callStack: inspectable.callStack,
    comparisons: inspectable.metrics.comparisons,
    swaps: inspectable.metrics.swaps,
    arrayAccesses: inspectable.metrics.arrayAccesses,
    highlightedIndices: inspectable.highlightedIndices,
    currentOperation: inspectable.currentOperation,
    currentLine: inspectable.currentLine,
  };
}

function replayToStep(state, targetStep) {
  if (!state.compiledProgram) {
    return null;
  }

  const safeTarget = Math.max(0, targetStep);
  const nearestStep = getNearestSnapshotStep(safeTarget, state.snapshots);
  const snapshotRuntime = state.snapshots[nearestStep]
    ? cloneValue(state.snapshots[nearestStep])
    : createRuntime(state.compiledProgram);
  const replaySteps = safeTarget - nearestStep;

  const replayResult = replay(state.compiledProgram, replaySteps, snapshotRuntime);
  const tracePrefix = state.traceLog.slice(0, nearestStep);
  const traceLog = [...tracePrefix, ...replayResult.stepRecords];

  return {
    runtime: replayResult.runtime,
    traceLog,
    currentStep: traceLog.length,
    historyCursor: traceLog.length,
  };
}

export function executionReducer(state, action) {
  switch (action.type) {
    case "LOAD_CODE":
      return {
        ...state,
        code: action.payload ?? "",
        parseError: null,
        error: null,
        executionStatus: "idle",
        currentStep: 0,
        historyCursor: 0,
        totalSteps: 0,
        traceLog: [],
        runtime: null,
        snapshots: {},
        variables: {},
        callStack: [],
        comparisons: 0,
        swaps: 0,
        arrayAccesses: 0,
        highlightedIndices: [],
        currentOperation: "",
        currentLine: null,
      };
    case "PARSE_SUCCESS": {
      const {
        ast,
        compiledProgram,
        runtime,
        totalSteps,
        pendingRestoreSteps = state.pendingRestoreSteps,
      } = action.payload;

      let nextRuntime = runtime;
      let nextTrace = [];
      let nextCurrentStep = 0;
      const snapshots = { 0: cloneValue(runtime) };

      if (pendingRestoreSteps && pendingRestoreSteps > 0) {
        const replayResult = replay(compiledProgram, pendingRestoreSteps, cloneValue(runtime));
        nextRuntime = replayResult.runtime;
        nextTrace = replayResult.stepRecords;
        nextCurrentStep = nextTrace.length;
        if (nextCurrentStep % SNAPSHOT_INTERVAL === 0) {
          snapshots[nextCurrentStep] = cloneValue(nextRuntime);
        }
      }

      return {
        ...state,
        ast,
        parseError: null,
        error: null,
        compiledProgram,
        runtime: nextRuntime,
        executionStatus: "idle",
        traceLog: nextTrace,
        currentStep: nextCurrentStep,
        historyCursor: nextCurrentStep,
        totalSteps: totalSteps ?? 0,
        snapshots,
        pendingRestoreSteps: null,
        ...hydrateFromRuntime(nextRuntime),
      };
    }
    case "PARSE_ERROR":
      return {
        ...state,
        ast: null,
        parseError: action.payload,
        error: null,
        compiledProgram: null,
        runtime: null,
        executionStatus: "error",
        currentStep: 0,
        historyCursor: 0,
        totalSteps: 0,
        traceLog: [],
        snapshots: {},
        ...hydrateFromRuntime(null),
      };
    case "RUN_START":
      if (!state.runtime || state.parseError || state.executionStatus === "finished") {
        return state;
      }
      return {
        ...state,
        executionStatus: "running",
      };
    case "RUN_PAUSE":
      if (state.executionStatus !== "running") {
        return state;
      }
      return {
        ...state,
        executionStatus: "paused",
      };
    case "RUN_STOP":
      return {
        ...state,
        executionStatus: "idle",
      };
    case "SET_SPEED":
      return {
        ...state,
        speed: Math.min(MAX_SPEED, Math.max(MIN_SPEED, Number(action.payload) || 1)),
      };
    case "TOGGLE_BREAKPOINT": {
      const line = Number(action.payload);
      const nextBreakpoints = new Set(state.breakpoints);
      if (nextBreakpoints.has(line)) {
        nextBreakpoints.delete(line);
      } else {
        nextBreakpoints.add(line);
      }
      return {
        ...state,
        breakpoints: nextBreakpoints,
      };
    }
    case "RESET": {
      if (!state.compiledProgram) {
        return {
          ...state,
          executionStatus: "idle",
          currentStep: 0,
          historyCursor: 0,
          traceLog: [],
          error: null,
        };
      }
      const runtime = createRuntime(state.compiledProgram);
      return {
        ...state,
        executionStatus: "idle",
        currentStep: 0,
        historyCursor: 0,
        traceLog: [],
        error: null,
        runtime,
        snapshots: { 0: cloneValue(runtime) },
        ...hydrateFromRuntime(runtime),
      };
    }
    case "STEP_BACKWARD": {
      if (state.currentStep === 0) {
        return state;
      }
      const replayState = replayToStep(state, state.currentStep - 1);
      if (!replayState) {
        return state;
      }

      return {
        ...state,
        executionStatus: "paused",
        runtime: replayState.runtime,
        traceLog: replayState.traceLog,
        currentStep: replayState.currentStep,
        historyCursor: replayState.historyCursor,
        error: null,
        ...hydrateFromRuntime(replayState.runtime),
      };
    }
    case "STEP_FORWARD": {
      if (!state.runtime || state.parseError || state.executionStatus === "finished") {
        return state;
      }

      const respectBreakpoints = action.payload?.respectBreakpoints ?? false;
      const lineBeforeStep = getCurrentLine(state.runtime);
      if (
        respectBreakpoints &&
        lineBeforeStep != null &&
        state.breakpoints.has(lineBeforeStep) &&
        state.executionStatus === "running"
      ) {
        return { ...state, executionStatus: "paused" };
      }

      const stepResult = stepRuntime(state.runtime);
      const nextRuntime = stepResult.runtime;
      const nextTrace = stepResult.record ? [...state.traceLog, stepResult.record] : state.traceLog;
      const nextStepCount = nextTrace.length;
      const nextSnapshots = { ...state.snapshots };
      if (nextStepCount > 0 && nextStepCount % SNAPSHOT_INTERVAL === 0) {
        nextSnapshots[nextStepCount] = cloneValue(nextRuntime);
      }

      let nextStatus = state.executionStatus;
      if (stepResult.error) {
        nextStatus = "error";
      } else if (stepResult.done) {
        nextStatus = "finished";
      } else if (state.executionStatus !== "running") {
        nextStatus = "paused";
      }

      return {
        ...state,
        runtime: nextRuntime,
        traceLog: nextTrace,
        currentStep: nextStepCount,
        historyCursor: nextStepCount,
        executionStatus: nextStatus,
        error: stepResult.error ?? null,
        snapshots: nextSnapshots,
        ...hydrateFromRuntime(nextRuntime),
      };
    }
    case "RUNTIME_ERROR":
      return {
        ...state,
        executionStatus: "error",
        error: action.payload ?? "Runtime error",
      };
    case "SET_SELECTED_ALGORITHM":
      return {
        ...state,
        selectedAlgorithmId: action.payload,
      };
    case "QUEUE_RESTORE":
      return {
        ...state,
        pendingRestoreSteps: Number(action.payload ?? 0),
      };
    default:
      return state;
  }
}

export function useExecution() {
  const [state, dispatch] = useReducer(executionReducer, null, createBaseState);
  const { currentLanguage } = useLanguage();
  const parseResult = useParser(state.code, currentLanguage);

  useEffect(() => {
    if (parseResult.error) {
      dispatch({ type: "PARSE_ERROR", payload: parseResult.error });
      return;
    }

    try {
      const compiledProgram = compileProgram(parseResult.ast);
      const runtime = createRuntime(compiledProgram);
      const totalSteps = estimateTotalSteps(compiledProgram, 5000);
      dispatch({
        type: "PARSE_SUCCESS",
        payload: {
          ast: parseResult.ast,
          compiledProgram,
          runtime,
          totalSteps,
        },
      });
    } catch (error) {
      dispatch({
        type: "PARSE_ERROR",
        payload: error.message,
      });
    }
  }, [parseResult]);

  useEffect(() => {
    if (state.executionStatus !== "running") {
      return undefined;
    }
    const delay = Math.max(120, Math.round(650 / state.speed));
    const timer = window.setInterval(() => {
      dispatch({ type: "STEP_FORWARD", payload: { respectBreakpoints: true } });
    }, delay);

    return () => window.clearInterval(timer);
  }, [state.executionStatus, state.speed]);

  const loadCode = useCallback((code) => {
    dispatch({ type: "LOAD_CODE", payload: code });
  }, []);

  const stepForward = useCallback(() => {
    dispatch({ type: "STEP_FORWARD", payload: { respectBreakpoints: false } });
  }, []);

  const stepBackward = useCallback(() => {
    dispatch({ type: "STEP_BACKWARD" });
  }, []);

  const run = useCallback(() => {
    dispatch({ type: "RUN_START" });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "RUN_PAUSE" });
  }, []);

  const stop = useCallback(() => {
    dispatch({ type: "RUN_STOP" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const setSpeed = useCallback((speed) => {
    dispatch({ type: "SET_SPEED", payload: speed });
  }, []);

  const toggleBreakpoint = useCallback((line) => {
    dispatch({ type: "TOGGLE_BREAKPOINT", payload: line });
  }, []);

  const selectAlgorithm = useCallback((algorithmId) => {
    dispatch({ type: "SET_SELECTED_ALGORITHM", payload: algorithmId });
  }, []);

  const queueRestore = useCallback((steps) => {
    dispatch({ type: "QUEUE_RESTORE", payload: steps });
  }, []);

  const loadSession = useCallback((session) => {
    dispatch({ type: "SET_SELECTED_ALGORITHM", payload: session.selectedAlgorithm ?? "custom" });
    dispatch({ type: "QUEUE_RESTORE", payload: session.stepRecords?.length ?? 0 });
    dispatch({ type: "LOAD_CODE", payload: session.code ?? "" });
  }, []);

  return {
    state,
    dispatch,
    loadCode,
    stepForward,
    stepBackward,
    run,
    pause,
    stop,
    reset,
    setSpeed,
    toggleBreakpoint,
    selectAlgorithm,
    queueRestore,
    loadSession,
  };
}
