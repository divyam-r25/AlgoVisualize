import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PlayerControls from "../components/player/PlayerControls";
import { CodeEditorProvider } from "../context/CodeEditorContext";
import { ExecutionProvider, useExecutionContext } from "../context/ExecutionContext";
import { VisualizationProvider } from "../context/VisualizationContext";

function TestHarness() {
  const { state, actions } = useExecutionContext();
  return (
    <div>
      <PlayerControls />
      <button onClick={() => actions.toggleBreakpoint(state.currentLine ?? 1)} type="button">
        toggle-current-breakpoint
      </button>
      <div data-testid="status">{state.executionStatus}</div>
      <div data-testid="step">{state.currentStep}</div>
      <div data-testid="line">{String(state.currentLine)}</div>
    </div>
  );
}

function renderHarness() {
  return render(
    <ExecutionProvider>
      <VisualizationProvider>
        <CodeEditorProvider>
          <TestHarness />
        </CodeEditorProvider>
      </VisualizationProvider>
    </ExecutionProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("editor flow integration", () => {
  it("steps forward and backward from controls", async () => {
    renderHarness();

    const stepButton = await screen.findByRole("button", { name: "Step +" });
    fireEvent.click(stepButton);
    expect(Number(screen.getByTestId("step").textContent)).toBeGreaterThanOrEqual(1);

    const backButton = screen.getByRole("button", { name: "Step -" });
    fireEvent.click(backButton);
    expect(Number(screen.getByTestId("step").textContent)).toBeGreaterThanOrEqual(0);
  });

  it("respects breakpoints during run loop", async () => {
    renderHarness();

    await waitFor(() => {
      expect(screen.getAllByTestId("line")[0].textContent).not.toBe("null");
    });

    const breakpointButton = await screen.findByRole("button", {
      name: "toggle-current-breakpoint",
    });
    fireEvent.click(breakpointButton);

    const playButton = screen.getByRole("button", { name: "Play" });
    fireEvent.click(playButton);

    await waitFor(
      () => {
        expect(screen.getAllByTestId("status")[0]).toHaveTextContent("paused");
      },
      { timeout: 4000 },
    );
  });
});
