import { ALGORITHM_LIBRARY } from "./library";

export const SORTING_ALGORITHMS = ALGORITHM_LIBRARY.filter((algorithm) =>
  ["bubble-sort", "merge-sort"].includes(algorithm.id),
);
