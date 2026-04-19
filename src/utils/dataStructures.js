export class ArrayModel {
  constructor(values = []) {
    this.values = Array.isArray(values) ? [...values] : [];
  }

  swap(i, j) {
    const temp = this.values[i];
    this.values[i] = this.values[j];
    this.values[j] = temp;
  }
}

export class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

export class GraphModel {
  constructor(adjacency = {}) {
    this.adjacency = adjacency;
  }

  neighbors(node) {
    return this.adjacency[node] ?? [];
  }
}
