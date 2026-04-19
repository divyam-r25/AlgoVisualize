/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";

const CodeEditorContext = createContext(null);

export function CodeEditorProvider({ children }) {
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const value = useMemo(
    () => ({
      isFocused,
      setIsFocused,
      cursorPosition,
      setCursorPosition,
    }),
    [isFocused, cursorPosition],
  );

  return <CodeEditorContext.Provider value={value}>{children}</CodeEditorContext.Provider>;
}

export function useCodeEditorContext() {
  const context = useContext(CodeEditorContext);
  if (!context) {
    throw new Error("useCodeEditorContext must be used inside CodeEditorProvider.");
  }
  return context;
}
