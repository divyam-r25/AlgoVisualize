import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import { useExecutionContext } from "../context/ExecutionContext";
import {
  deleteSessionById,
  getSessionById,
  listSessions,
} from "../services/persistence/localSessions";

function formatTime(timestamp) {
  if (!timestamp) {
    return "Unknown date";
  }
  return new Date(timestamp).toLocaleString();
}

export default function SavedSessionsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { actions } = useExecutionContext();
  const [_version, setVersion] = useState(0);
  const sessions = listSessions();
  const highlighted = params.id ? getSessionById(params.id) : null;

  return (
    <main className="saved-page">
      <section className="page-hero">
        <h2>Saved Sessions</h2>
        <p>Replay persisted step records from local storage.</p>
      </section>

      {highlighted ? (
        <section className="panel panel-session-highlight">
          <header className="panel-header">
            <h3>Shared Session: {highlighted.id}</h3>
          </header>
          <p>
            Created {formatTime(highlighted.createdAt)} - {highlighted.stepRecords?.length ?? 0} steps
          </p>
          <Button
            onClick={() => {
              actions.loadSession(highlighted);
              navigate("/editor");
            }}
          >
            Replay This Session
          </Button>
        </section>
      ) : null}

      {sessions.length === 0 ? (
        <section className="panel">
          <p className="empty-state">No saved sessions yet. Run an algorithm and click Save Session.</p>
        </section>
      ) : (
        <section className="saved-grid">
          {sessions.map((session) => (
            <article key={session.id} className="saved-card">
              <h3>{session.selectedAlgorithm ?? "custom"}</h3>
              <p>{formatTime(session.createdAt)}</p>
              <p>{session.stepRecords?.length ?? 0} steps</p>
              <div className="saved-actions">
                <Button
                  onClick={() => {
                    actions.loadSession(session);
                    navigate("/editor");
                  }}
                >
                  Replay
                </Button>
                <Button
                  variant="warning"
                  onClick={async () => {
                    const link = `${window.location.origin}/saved/${session.id}`;
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(link);
                      return;
                    }
                    window.prompt("Copy this replay link:", link);
                  }}
                >
                  Copy Link
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    deleteSessionById(session.id);
                    setVersion((value) => value + 1);
                  }}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
