import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useExecutionContext } from "../context/ExecutionContext";
import { ALGORITHM_LIBRARY } from "../services/algorithms/library";

function navigateWithTransition(navigate, path) {
  if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
    document.startViewTransition(() => navigate(path));
    return;
  }
  navigate(path);
}

export default function AlgorithmLibraryPage() {
  const navigate = useNavigate();
  const { actions, state } = useExecutionContext();

  return (
    <main className="library-page">
      <section className="page-hero">
        <h2>Algorithm Library</h2>
        <p>Load curated examples with deterministic replay support.</p>
      </section>

      <section className="library-grid">
        {ALGORITHM_LIBRARY.map((algorithm) => (
          <article key={algorithm.id} className="library-card">
            <div>
              <h3>{algorithm.name}</h3>
              <p>{algorithm.description}</p>
              <span className="chip">{algorithm.vizType}</span>
            </div>
            <div className="library-actions">
              <Button
                variant={state.selectedAlgorithmId === algorithm.id ? "success" : "default"}
                onClick={() => {
                  actions.selectAlgorithm(algorithm.id);
                  actions.loadCode(algorithm.code);
                  actions.reset();
                  navigateWithTransition(navigate, "/editor");
                }}
              >
                Load in Editor
              </Button>
            </div>
            <pre>{algorithm.code}</pre>
          </article>
        ))}
      </section>
    </main>
  );
}
