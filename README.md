# Algorithm Visualizer

Interactive, deterministic algorithm execution visualizer built with React + Vite.

Users can paste JavaScript algorithms, parse them into AST, execute line-by-line with a reducer-driven state machine, inspect variables/call stack/trace, control playback, set breakpoints, and save replay sessions.

## Features

- Monaco code editor with controlled input + gutter breakpoints
- Acorn parser pipeline with parse error reporting (line/column)
- Deterministic AST-instruction execution engine (no direct `eval`)
- Reducer-driven execution state machine:
  - `STEP_FORWARD`, `STEP_BACKWARD`, `RUN_START`, `RUN_PAUSE`, `RESET`
  - breakpoint handling and runtime error state
- Visualization:
  - D3 array visualizer with highlighted indices and animation cleanup
  - call stack and trace panels
  - graph traversal output panel
- Metrics tracking:
  - comparisons, swaps/writes, array accesses
- Algorithm library (Bubble Sort, Binary Search, Merge Sort, BFS, DFS)
- Session persistence:
  - save replay payload to localStorage
  - replay via `/saved/:id` shareable route
- Route-based app split with `React.lazy + Suspense`
- Test coverage for parser, reducer transitions, execution engine, and UI flow

## Architecture

```text
CodeEditor (Monaco)
  -> parseAndValidate (Acorn)
  -> compileProgram (instruction list)
  -> useExecution reducer state machine
      -> stepRuntime() deterministic execution
      -> trace records + metrics + call stack snapshots
  -> VisualizationCanvas
      -> ArrayVisualizer (D3)
      -> Graph/Tree placeholders
  -> PlayerControls / VariableInspector / TraceOutput / CallStackVisualizer
```

## Tech Stack

- React 19
- React Router v7
- Monaco Editor
- Acorn + acorn-walk
- D3
- Firebase SDK scaffold (optional env-driven)
- Vitest + Testing Library

## Project Structure

```text
src/
  components/
    layout/         # Navbar, split layout
    player/         # controls, metrics, variable inspector
    ui/             # editor + reusable controls
    visualization/  # array, graph, trace, call stack, canvas switcher
  context/          # Execution, Visualization, CodeEditor providers
  hooks/            # useExecution + parser/perf/breakpoint hooks
  pages/            # editor, algorithm library, saved sessions
  services/
    algorithms/     # curated algorithm templates
    persistence/    # localStorage save/load
    parser.js
    executionEngine.js
    sandboxRunner.js
    codeRunner.js
    firebase.js
  workers/          # sandbox worker API
  test/             # parser/reducer/engine/UI tests
```

## Commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## How To Add a New Algorithm

1. Open `src/services/algorithms/library.js`.
2. Add a new object to `ALGORITHM_LIBRARY`:
   - `id`
   - `name`
   - `vizType` (`array`, `graph`, `tree`)
   - `description`
   - `code` (JavaScript source)
3. Keep code inside the supported syntax subset:
   - declarations, assignment, if/while/for, function declarations/calls, return
   - common array methods and `Math.*` helpers
4. Load from Library page and verify step trace + visualization.

## Save Payload Contract

Saved session payload shape:

```json
{
  "id": "session-...",
  "version": 1,
  "language": "javascript",
  "selectedAlgorithm": "bubble-sort",
  "code": "function ...",
  "stepRecords": [],
  "createdAt": 0
}
```

## Notes

- Runtime is deterministic and replayable from step records.
- Snapshot + replay strategy is used for efficient rewind.
- Firebase integration is scaffolded and optional; local save is fully working out of the box.
