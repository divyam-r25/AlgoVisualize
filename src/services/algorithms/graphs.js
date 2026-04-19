import { ALGORITHM_LIBRARY } from "./library";

export const GRAPH_ALGORITHMS = ALGORITHM_LIBRARY.filter((algorithm) =>
  ["bfs", "dfs"].includes(algorithm.id),
);
