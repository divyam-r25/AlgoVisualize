export function createInitialMetrics() {
  return {
    comparisons: 0,
    swaps: 0,
    arrayAccesses: 0,
  };
}

export function mergeMetricDelta(base, delta) {
  return {
    comparisons: base.comparisons + (delta.comparisons ?? 0),
    swaps: base.swaps + (delta.swaps ?? 0),
    arrayAccesses: base.arrayAccesses + (delta.arrayAccesses ?? 0),
  };
}
