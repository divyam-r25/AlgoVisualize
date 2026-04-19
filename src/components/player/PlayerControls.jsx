import Button from "../ui/Button";
import Slider from "../ui/Slider";
import { useExecutionContext } from "../../context/ExecutionContext";

export default function PlayerControls() {
  const { state, actions } = useExecutionContext();
  const isRunning = state.executionStatus === "running";

  return (
    <section className="panel panel-controls">
      <header className="panel-header">
        <h2>Player Controls</h2>
      </header>
      <div className="controls-grid">
        <Button onClick={actions.run} disabled={isRunning || !!state.parseError}>
          Play
        </Button>
        <Button onClick={actions.pause} disabled={!isRunning} variant="warning">
          Pause
        </Button>
        <Button
          onClick={actions.stepForward}
          disabled={isRunning || !!state.parseError || state.executionStatus === "finished"}
        >
          Step +
        </Button>
        <Button onClick={actions.stepBackward} disabled={isRunning || state.currentStep === 0}>
          Step -
        </Button>
        <Button onClick={actions.reset} variant="danger">
          Reset
        </Button>
        <Button onClick={actions.saveCurrentSession} variant="success">
          Save Session
        </Button>
      </div>

      <Slider
        id="playback-speed"
        min={0.25}
        max={2}
        step={0.25}
        value={state.speed}
        onChange={actions.setSpeed}
        label="Playback speed"
      />
      <p className="hint">
        Step {state.currentStep} / {state.totalSteps}
      </p>
    </section>
  );
}
