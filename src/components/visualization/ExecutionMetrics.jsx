import { useMemo } from 'react';
import styles from './ExecutionMetrics.module.css';

export function ExecutionMetrics({ executionState, executionTime = 0 }) {
  const metrics = useMemo(() => {
    if (!executionState) return null;

    const {
      comparisons = 0,
      swaps = 0,
      arrayAccesses = 0,
      currentStep = 0,
      totalSteps = 0,
    } = executionState;

    // Estimate time complexity based on input size (simplified)
    const estimateComplexity = () => {
      // This is a heuristic - would be more accurate with actual algorithm info
      if (swaps === 0 && arrayAccesses < 100) return 'O(1)';
      if (comparisons <= arrayAccesses) return 'O(n)';
      if (comparisons <= arrayAccesses * Math.log(arrayAccesses)) return 'O(n log n)';
      if (comparisons <= arrayAccesses * arrayAccesses) return 'O(n²)';
      return 'O(n³+)';
    };

    return {
      comparisons,
      swaps,
      arrayAccesses,
      currentStep,
      totalSteps,
      timeMs: executionTime.toFixed(2),
      complexity: estimateComplexity(),
      efficiency: swaps > 0 ? ((arrayAccesses / (swaps + 1)).toFixed(2)) : 'N/A',
    };
  }, [executionState, executionTime]);

  if (!metrics) {
    return <div className={styles.metricsContainer}>No metrics available</div>;
  }

  return (
    <div className={styles.metricsContainer}>
      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Comparisons</div>
          <div className={styles.metricValue}>{metrics.comparisons.toLocaleString()}</div>
          <div className={styles.metricDesc}>Total comparisons made</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Swaps</div>
          <div className={styles.metricValue}>{metrics.swaps.toLocaleString()}</div>
          <div className={styles.metricDesc}>Total swap operations</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Array Accesses</div>
          <div className={styles.metricValue}>{metrics.arrayAccesses.toLocaleString()}</div>
          <div className={styles.metricDesc}>Memory read/write ops</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Time Complexity</div>
          <div className={styles.metricValue}>{metrics.complexity}</div>
          <div className={styles.metricDesc}>Estimated growth rate</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Execution Time</div>
          <div className={styles.metricValue}>{metrics.timeMs}ms</div>
          <div className={styles.metricDesc}>Elapsed milliseconds</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Progress</div>
          <div className={styles.metricValue}>
            {metrics.currentStep}/{metrics.totalSteps}
          </div>
          <div className={styles.metricDesc}>
            {metrics.totalSteps > 0
              ? ((metrics.currentStep / metrics.totalSteps) * 100).toFixed(0) + '%'
              : '0%'}
          </div>
        </div>
      </div>

      <div className={styles.analysisSection}>
        <h3 className={styles.analysisTitle}>Performance Analysis</h3>
        <div className={styles.analysisList}>
          {metrics.swaps > 0 && (
            <div className={styles.analysisItem}>
              <span className={styles.analysisIcon}>📊</span>
              <span>
                Efficiency ratio: {metrics.efficiency} (accesses per swap)
              </span>
            </div>
          )}
          {metrics.comparisons > 0 && (
            <div className={styles.analysisItem}>
              <span className={styles.analysisIcon}>🔍</span>
              <span>
                Comparison rate: {(metrics.comparisons / Math.max(1, metrics.arrayAccesses)).toFixed(2)}
                x array size
              </span>
            </div>
          )}
          <div className={styles.analysisItem}>
            <span className={styles.analysisIcon}>⚡</span>
            <span>Estimated complexity: {metrics.complexity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
