import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useExecutionContext } from '../../context/ExecutionContext';
import { useTheme } from '../../context/ThemeContext';

function normalizeArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map(v => (typeof v === 'number' ? v : 0));
}

function pickPrimaryArray(variables) {
  if (Array.isArray(variables?.arr)) return normalizeArray(variables.arr);
  const first = Object.values(variables || {}).find(v => Array.isArray(v));
  return normalizeArray(first);
}

export default function ArrayVisualizer({ compact = false }) {
  const svgRef = useRef(null);
  const { state: { variables, highlightedIndices, speed } } = useExecutionContext();
  const { isDark } = useTheme();
  const data = useMemo(() => pickPrimaryArray(variables), [variables]);

  useEffect(() => {
    if (!svgRef.current) return undefined;
    const width = 440;
    const height = compact ? 160 : 260;
    const padding = 12;
    const svg = d3.select(svgRef.current).attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();

    if (data.length === 0) return undefined;

    const maxValue = Math.max(...data, 1);
    const barWidth = (width - padding * 2) / data.length;
    const barFill = (_, i) =>
      highlightedIndices.includes(i) ? '#1a1a1a' : '#d1d5db';
    const textFill = isDark ? '#8b949e' : '#6b7280';

    const groups = svg
      .selectAll('g.bar-group')
      .data(data, (_, i) => i)
      .join(enter => enter.append('g').attr('class', 'bar-group'));

    groups.attr('transform', (_, i) => `translate(${padding + i * barWidth},0)`);

    groups
      .append('rect')
      .attr('x', 2)
      .attr('width', Math.max(6, barWidth - 6))
      .attr('y', height - 30)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', barFill)
      .transition()
      .duration(Math.max(80, 400 / speed))
      .attr('y', v => height - 30 - (v / maxValue) * (height - 55))
      .attr('height', v => (v / maxValue) * (height - 55));

    groups
      .append('text')
      .attr('x', barWidth / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', textFill)
      .text(v => v);

    return () => { svg.selectAll('*').interrupt(); };
  }, [data, highlightedIndices, speed, compact, isDark]);

  return (
    <div>
      <p className="bottom-panel-title">
        <span>📊</span> Array Visualization
      </p>
      {data.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
          Run an algorithm to visualize the array.
        </p>
      ) : (
        <svg
          ref={svgRef}
          style={{ width: '100%', height: compact ? 160 : 240 }}
        />
      )}
    </div>
  );
}
