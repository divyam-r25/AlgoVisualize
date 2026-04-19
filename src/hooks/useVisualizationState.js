import { useReducer } from "react";

const initialVisualizationState = {
  vizType: "array",
  showTraceLog: true,
  showVariableInspector: true,
  showCallStack: true,
  highlightMode: "current",
};

function visualizationReducer(state, action) {
  switch (action.type) {
    case "SET_VIZ_TYPE":
      return { ...state, vizType: action.payload };
    case "TOGGLE_TRACE":
      return { ...state, showTraceLog: !state.showTraceLog };
    case "TOGGLE_VARIABLES":
      return { ...state, showVariableInspector: !state.showVariableInspector };
    case "TOGGLE_CALL_STACK":
      return { ...state, showCallStack: !state.showCallStack };
    case "SET_HIGHLIGHT_MODE":
      return { ...state, highlightMode: action.payload };
    default:
      return state;
  }
}

export function useVisualizationState() {
  return useReducer(visualizationReducer, initialVisualizationState);
}
