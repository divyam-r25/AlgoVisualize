import { useExecutionContext } from "../../context/ExecutionContext";

export default function GraphVisualizer() {
  const {
    state: { variables },
  } = useExecutionContext();

  const nodes = Array.isArray(variables.order)
    ? variables.order
    : Array.isArray(variables.visitOrder)
      ? variables.visitOrder
      : [];

  return (
    <section className="panel panel-visualization">
      <header className="panel-header">
        <h2>Graph Traversal</h2>
      </header>
      {nodes.length === 0 ? (
        <p className="empty-state">Run BFS/DFS to see traversal order.</p>
      ) : (
        <ul className="graph-order-list">
          {nodes.map((node, index) => (
            <li key={`${node}-${index}`}>
              <span>{index + 1}</span>
              <strong>{node}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
