import SplitPane from "../components/layout/SplitPane";
import PlayerControls from "../components/player/PlayerControls";
import PerformanceMetrics from "../components/player/PerformanceMetrics";
import VariableInspector from "../components/player/VariableInspector";
import CodeEditor from "../components/ui/CodeEditor";
import ErrorBanner from "../components/ui/ErrorBanner";
import CallStackVisualizer from "../components/visualization/CallStackVisualizer";
import TraceOutput from "../components/visualization/TraceOutput";
import VisualizationCanvas from "../components/visualization/VisualizationCanvas";
import { useExecutionContext } from "../context/ExecutionContext";
import { useVisualizationContext } from "../context/VisualizationContext";
import Select from "../components/ui/Select";

const VIZ_OPTIONS = [
  { label: "Array", value: "array" },
  { label: "Graph", value: "graph" },
  { label: "Tree", value: "tree" },
];

export default function EditorPage() {
  const {
    state: { parseError, error },
  } = useExecutionContext();
  const {
    state: { vizType, showTraceLog, showCallStack, showVariableInspector },
    actions: vizActions,
  } = useVisualizationContext();

  return (
    <main className="editor-page">
      <ErrorBanner message={parseError || error} />
      <SplitPane
        left={
          <>
            <CodeEditor />
            <PlayerControls />
            <PerformanceMetrics />
            <section className="panel panel-toggles">
              <header className="panel-header">
                <h2>Display Options</h2>
              </header>
              <Select
                id="viz-type"
                label="Visualizer"
                value={vizType}
                options={VIZ_OPTIONS}
                onChange={vizActions.setVizType}
              />
              <div className="toggle-row">
                <label>
                  <input type="checkbox" checked={showTraceLog} onChange={vizActions.toggleTrace} />
                  Trace
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showCallStack}
                    onChange={vizActions.toggleCallStack}
                  />
                  Call Stack
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showVariableInspector}
                    onChange={vizActions.toggleVariables}
                  />
                  Variables
                </label>
              </div>
            </section>
          </>
        }
        right={
          <>
            <VisualizationCanvas />
            {showVariableInspector && <VariableInspector />}
            {showCallStack && <CallStackVisualizer />}
            {showTraceLog && <TraceOutput />}
          </>
        }
      />
    </main>
  );
}
