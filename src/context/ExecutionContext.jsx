/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo } from "react";
import { useBreakpoints } from "../hooks/useBreakpoints";
import { useExecution } from "../hooks/useExecution";
import { usePerformanceTracking } from "../hooks/usePerformanceTracking";
import { saveSession } from "../services/persistence/localSessions";

const ExecutionContext = createContext(null);

export function ExecutionProvider({ children }) {
  const execution = useExecution();
  const breakpoints = useBreakpoints(execution.state.breakpoints);
  const performance = usePerformanceTracking(
    {
      comparisons: execution.state.comparisons,
      swaps: execution.state.swaps,
      arrayAccesses: execution.state.arrayAccesses,
    },
    execution.state.currentStep,
    execution.state.totalSteps,
  );

  const saveCurrentSession = useCallback(() => {
    const payload = {
      code: execution.state.code,
      language: "javascript",
      selectedAlgorithm: execution.state.selectedAlgorithmId,
      stepRecords: execution.state.traceLog,
      createdAt: Date.now(),
      version: 1,
    };
    return saveSession(payload);
  }, [execution.state.code, execution.state.selectedAlgorithmId, execution.state.traceLog]);

  const contextValue = useMemo(
    () => ({
      state: execution.state,
      actions: {
        loadCode: execution.loadCode,
        stepForward: execution.stepForward,
        stepBackward: execution.stepBackward,
        run: execution.run,
        pause: execution.pause,
        stop: execution.stop,
        reset: execution.reset,
        setSpeed: execution.setSpeed,
        toggleBreakpoint: execution.toggleBreakpoint,
        selectAlgorithm: execution.selectAlgorithm,
        queueRestore: execution.queueRestore,
        loadSession: execution.loadSession,
        saveCurrentSession,
      },
      selectors: {
        breakpoints,
        performance,
      },
    }),
    [
      breakpoints,
      execution.loadCode,
      execution.loadSession,
      execution.pause,
      execution.queueRestore,
      execution.reset,
      execution.run,
      execution.selectAlgorithm,
      execution.setSpeed,
      execution.state,
      execution.stepBackward,
      execution.stepForward,
      execution.stop,
      execution.toggleBreakpoint,
      performance,
      saveCurrentSession,
    ],
  );

  return <ExecutionContext.Provider value={contextValue}>{children}</ExecutionContext.Provider>;
}

export function useExecutionContext() {
  const context = useContext(ExecutionContext);
  if (!context) {
    throw new Error("useExecutionContext must be used inside ExecutionProvider.");
  }
  return context;
}

export { ExecutionContext };
