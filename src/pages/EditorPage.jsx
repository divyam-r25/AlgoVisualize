import CodeEditor from '../components/ui/CodeEditor';
import ErrorBanner from '../components/ui/ErrorBanner';
import ExecutionControls from '../components/player/ExecutionControls';
import VariablesPanel from '../components/player/VariablesPanel';
import ArrayVisualizer from '../components/visualization/ArrayVisualizer';
import ExecutionMetricsPanel from '../components/visualization/ExecutionMetricsPanel';
import CallStackPanel from '../components/visualization/CallStackPanel';
import { useExecutionContext } from '../context/ExecutionContext';

export default function EditorPage() {
  const {
    state: { parseError, error },
  } = useExecutionContext();

  return (
    <div className="editor-page">
      {(parseError || error) && <ErrorBanner message={parseError || error} />}

      {/* Two-column main area */}
      <div className="editor-main">
        {/* Left: Code Editor */}
        <div className="editor-left">
          <div className="editor-code-panel">
            <CodeEditor />
          </div>
        </div>

        {/* Right: Execution Controls + Variables */}
        <div className="editor-right">
          <ExecutionControls />
          <VariablesPanel />
        </div>
      </div>

      {/* Bottom: Three panels side by side */}
      <div className="editor-bottom">
        <div className="editor-bottom-panel">
          <ArrayVisualizer compact />
        </div>
        <div className="editor-bottom-panel">
          <ExecutionMetricsPanel />
        </div>
        <div className="editor-bottom-panel">
          <CallStackPanel />
        </div>
      </div>
    </div>
  );
}
