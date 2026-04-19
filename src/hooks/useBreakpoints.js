import { useMemo } from "react";

export function useBreakpoints(breakpoints) {
  return useMemo(() => {
    const sorted = [...breakpoints].sort((a, b) => a - b);
    return {
      has(line) {
        return breakpoints.has(line);
      },
      list: sorted,
      isEmpty: sorted.length === 0,
    };
  }, [breakpoints]);
}
