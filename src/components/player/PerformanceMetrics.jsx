import { useExecutionContext } from "../../context/ExecutionContext";

export default function PerformanceMetrics() {
  const { selectors } = useExecutionContext();
  const metrics = selectors.performance;

  return (
    <section className="panel panel-metrics">
      <header className="panel-header">
        <h2>Performance</h2>
      </header>
      <ul className="metric-list">
        <li>
          <span>Comparisons</span>
          <strong>{metrics.comparisons}</strong>
        </li>
        <li>
          <span>Swaps / writes</span>
          <strong>{metrics.swaps}</strong>
        </li>
        <li>
          <span>Array accesses</span>
          <strong>{metrics.arrayAccesses}</strong>
        </li>
        <li>
          <span>Completion</span>
          <strong>{metrics.completion}%</strong>
        </li>
      </ul>
    </section>
  );
}
