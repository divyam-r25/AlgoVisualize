import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { useExecutionContext } from "../../context/ExecutionContext";

function normalizeArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.map((value) => (typeof value === "number" ? value : 0));
}

function pickPrimaryArray(variables) {
  if (Array.isArray(variables.arr)) {
    return normalizeArray(variables.arr);
  }
  const firstArrayValue = Object.values(variables).find((value) => Array.isArray(value));
  return normalizeArray(firstArrayValue);
}

export default function ArrayVisualizer() {
  const svgRef = useRef(null);
  const {
    state: { variables, highlightedIndices, speed },
  } = useExecutionContext();

  const data = useMemo(() => pickPrimaryArray(variables), [variables]);

  useEffect(() => {
    if (!svgRef.current) {
      return undefined;
    }

    const width = 880;
    const height = 280;
    const padding = 16;
    const svg = d3.select(svgRef.current).attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    if (data.length === 0) {
      return undefined;
    }

    const maxValue = Math.max(...data, 1);
    const barWidth = (width - padding * 2) / data.length;

    const groups = svg
      .selectAll("g.bar-group")
      .data(data, (_, index) => index)
      .join((enter) => enter.append("g").attr("class", "bar-group"));

    groups.attr("transform", (_, index) => `translate(${padding + index * barWidth},0)`);

    groups
      .append("rect")
      .attr("x", 1)
      .attr("width", Math.max(8, barWidth - 4))
      .attr("y", height - 40)
      .attr("height", 0)
      .attr("rx", 6)
      .attr("fill", (_, index) => (highlightedIndices.includes(index) ? "#f97316" : "#0ea5e9"))
      .transition()
      .duration(Math.max(80, 450 / speed))
      .attr("y", (value) => height - 40 - (value / maxValue) * (height - 80))
      .attr("height", (value) => (value / maxValue) * (height - 80));

    groups
      .append("text")
      .attr("x", barWidth / 2)
      .attr("y", height - 16)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "#e2e8f0")
      .text((value, index) => `${index}:${value}`);

    return () => {
      svg.selectAll("*").interrupt();
    };
  }, [data, highlightedIndices, speed]);

  return (
    <section className="panel panel-visualization">
      <header className="panel-header">
        <h2>Array Visualizer</h2>
      </header>
      {data.length === 0 ? (
        <p className="empty-state">Run an algorithm with array state to visualize updates.</p>
      ) : (
        <svg ref={svgRef} className="array-svg" />
      )}
    </section>
  );
}
