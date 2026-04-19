/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { useVisualizationState } from "../hooks/useVisualizationState";

const VisualizationContext = createContext(null);

export function VisualizationProvider({ children }) {
  const [state, dispatch] = useVisualizationState();

  const actions = useMemo(
    () => ({
      setVizType(vizType) {
        dispatch({ type: "SET_VIZ_TYPE", payload: vizType });
      },
      toggleTrace() {
        dispatch({ type: "TOGGLE_TRACE" });
      },
      toggleVariables() {
        dispatch({ type: "TOGGLE_VARIABLES" });
      },
      toggleCallStack() {
        dispatch({ type: "TOGGLE_CALL_STACK" });
      },
      setHighlightMode(mode) {
        dispatch({ type: "SET_HIGHLIGHT_MODE", payload: mode });
      },
    }),
    [dispatch],
  );

  const value = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions],
  );

  return <VisualizationContext.Provider value={value}>{children}</VisualizationContext.Provider>;
}

export function useVisualizationContext() {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error("useVisualizationContext must be used inside VisualizationProvider.");
  }
  return context;
}

export { VisualizationContext };
