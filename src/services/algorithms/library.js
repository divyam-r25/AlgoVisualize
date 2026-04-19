export const ALGORITHM_LIBRARY = [
  {
    id: "bubble-sort",
    name: "Bubble Sort",
    vizType: "array",
    description: "Repeatedly compares adjacent values and swaps them into order.",
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n - i - 1; j += 1) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const arr = [5, 1, 4, 2, 8];
const result = bubbleSort(arr);`,
  },
  {
    id: "binary-search",
    name: "Binary Search",
    vizType: "array",
    description: "Finds a target in sorted data by halving the search space.",
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid;
    }
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

const arr = [1, 3, 5, 7, 9, 11, 13];
const target = 9;
const index = binarySearch(arr, target);`,
  },
  {
    id: "merge-sort",
    name: "Merge Sort",
    vizType: "array",
    description: "Recursive divide-and-conquer sort with call stack visualization.",
    code: `function merge(left, right) {
  const merged = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      merged.push(left[i]);
      i += 1;
    } else {
      merged.push(right[j]);
      j += 1;
    }
  }

  while (i < left.length) {
    merged.push(left[i]);
    i += 1;
  }

  while (j < right.length) {
    merged.push(right[j]);
    j += 1;
  }

  return merged;
}

function mergeSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

const arr = [10, 7, 8, 9, 1, 5];
const sorted = mergeSort(arr);`,
  },
  {
    id: "bfs",
    name: "Breadth First Search",
    vizType: "graph",
    description: "Traverses graph level-by-level from a starting node.",
    code: `function bfs(graph, start) {
  const visited = {};
  const queue = [start];
  const order = [];
  visited[start] = true;

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    const neighbors = graph[node];

    for (let i = 0; i < neighbors.length; i += 1) {
      const next = neighbors[i];
      if (!visited[next]) {
        visited[next] = true;
        queue.push(next);
      }
    }
  }

  return order;
}

const graph = {
  A: ["B", "C"],
  B: ["D"],
  C: ["E", "F"],
  D: [],
  E: [],
  F: []
};

const visitOrder = bfs(graph, "A");`,
  },
  {
    id: "dfs",
    name: "Depth First Search",
    vizType: "graph",
    description: "Recursive graph traversal demonstrating nested call frames.",
    code: `function dfs(graph, node, visited, order) {
  visited[node] = true;
  order.push(node);
  const neighbors = graph[node];

  for (let i = 0; i < neighbors.length; i += 1) {
    const next = neighbors[i];
    if (!visited[next]) {
      dfs(graph, next, visited, order);
    }
  }

  return order;
}

const graph = {
  A: ["B", "C"],
  B: ["D"],
  C: ["E"],
  D: [],
  E: []
};

const visited = {};
const order = [];
const traversal = dfs(graph, "A", visited, order);`,
  },
];

export const DEFAULT_ALGORITHM = ALGORITHM_LIBRARY[0];

export function getAlgorithmById(id) {
  return ALGORITHM_LIBRARY.find((algorithm) => algorithm.id === id) ?? null;
}
