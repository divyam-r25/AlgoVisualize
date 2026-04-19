import { ALGORITHM_LIBRARY } from "./library";

export const SEARCHING_ALGORITHMS = ALGORITHM_LIBRARY.filter((algorithm) =>
  ["binary-search"].includes(algorithm.id),
);
