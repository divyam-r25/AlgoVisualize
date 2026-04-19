import { useMemo } from "react";

export function usePerformanceTracking(metrics, currentStep, totalSteps) {
  return useMemo(() => {
    const completion =
      totalSteps > 0 ? Math.min(100, Math.round((currentStep / totalSteps) * 100)) : 0;
    return {
      ...metrics,
      completion,
      currentStep,
      totalSteps,
    };
  }, [metrics, currentStep, totalSteps]);
}
