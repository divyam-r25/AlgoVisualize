import { useMemo } from "react";
import { useExecutionContext } from "../../context/ExecutionContext";
import { useVisualizationContext } from "../../context/VisualizationContext";
import { getAlgorithmById } from "../../services/algorithms/library";
import ArrayVisualizer from "./ArrayVisualizer";
import GraphVisualizer from "./GraphVisualizer";
import TreeVisualizer from "./TreeVisualizer";

export default function VisualizationCanvas() {
  const {
    state: { ast, parseError, selectedAlgorithmId, currentStep },
  } = useExecutionContext();
  const {
    state: { vizType },
  } = useVisualizationContext();

  const effectiveVizType = useMemo(() => {
    const selected = getAlgorithmById(selectedAlgorithmId);
    return selected?.vizType ?? vizType;
  }, [selectedAlgorithmId, vizType]);

  if (parseError) {
    return (
      <section className="panel panel-visualization">
        <header className="panel-header">
          <h2>Visualization</h2>
        </header>
        <p className="empty-state">Fix parser errors to start visual execution.</p>
      </section>
    );
  }

  if (!ast || currentStep === 0) {
    return (
      <section className="panel panel-visualization">
        <header className="panel-header">
          <h2>Visualization</h2>
        </header>
        <p className="empty-state">Run or step the code to generate visual state.</p>
      </section>
    );
  }

  if (effectiveVizType === "graph") {
    return <GraphVisualizer />;
  }

  if (effectiveVizType === "tree") {
    return <TreeVisualizer />;
  }

  return <ArrayVisualizer />;
}
