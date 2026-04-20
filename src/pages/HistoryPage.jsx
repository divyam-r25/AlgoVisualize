import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExecutionContext } from '../context/ExecutionContext';
import {
  deleteSessionById,
  listSessions,
} from '../services/persistence/localSessions';

function timeAgo(timestamp) {
  if (!timestamp) return 'Unknown date';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

const LANG_DISPLAY = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { actions } = useExecutionContext();
  const [version, setVersion] = useState(0);
  const sessions = listSessions();

  const handleReplay = (session) => {
    actions.loadSession(session);
    navigate('/editor');
  };

  const handleDelete = (id) => {
    deleteSessionById(id);
    setVersion(v => v + 1);
  };

  return (
    <main className="history-page">
      {sessions.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 24px' }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No execution history yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Run an algorithm in the editor and save it to see it here.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/editor')}
            style={{ marginTop: 16 }}
          >
            Open Editor
          </button>
        </div>
      ) : (
        <div className="history-list">
          {sessions.map(session => {
            const name = session.selectedAlgorithm ?? 'Custom Algorithm';
            const lang = LANG_DISPLAY[session.language] ?? session.language ?? 'javascript';
            const steps = session.stepRecords ?? [];
            // Extract metrics from trace log if available
            const lastStep = steps[steps.length - 1] ?? {};
            const comparisons = lastStep.comparisons ?? 0;
            const swaps = lastStep.swaps ?? 0;
            const execTime = lastStep.executionTime ?? '0';

            return (
              <div key={session.id} className="history-card">
                <div className="history-card-top">
                  <div>
                    <h2 className="history-card-name">{name}</h2>
                    <p className="history-card-time">
                      <span>⏱</span> {timeAgo(session.createdAt)}
                    </p>
                  </div>
                  <span className="history-lang-badge">{lang}</span>
                </div>

                <div className="history-metrics">
                  <div className="history-metric">
                    <span className="history-metric-label">Comparisons</span>
                    <span className="history-metric-value">{comparisons}</span>
                  </div>
                  <div className="history-metric">
                    <span className="history-metric-label">Swaps</span>
                    <span className="history-metric-value">{swaps}</span>
                  </div>
                  <div className="history-metric">
                    <span className="history-metric-label">Time</span>
                    <span className="history-metric-value">{execTime}ms</span>
                  </div>
                </div>

                {session.code && (
                  <div className="history-code-preview">
                    <pre>{session.code.slice(0, 600)}{session.code.length > 600 ? '\n...' : ''}</pre>
                  </div>
                )}

                <div className="history-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleReplay(session)}
                    id={`history-replay-${session.id}`}
                  >
                    Replay
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={async () => {
                      const link = `${window.location.origin}/saved/${session.id}`;
                      if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(link);
                      } else {
                        window.prompt('Copy link:', link);
                      }
                    }}
                    id={`history-copy-${session.id}`}
                  >
                    Copy Link
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(session.id)}
                    id={`history-delete-${session.id}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
