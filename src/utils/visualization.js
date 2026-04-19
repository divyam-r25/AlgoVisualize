export function buildVizPatchFromTrace(stepRecord) {
  return {
    highlightedIndices: stepRecord?.vizPatch?.highlightedIndices ?? [],
  };
}
