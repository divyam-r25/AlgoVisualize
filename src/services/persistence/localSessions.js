const STORAGE_KEY = "algo-visualizer:sessions:v1";

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readSessions() {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeSessions(sessions) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function listSessions() {
  return readSessions().sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function getSessionById(id) {
  return readSessions().find((session) => session.id === id) ?? null;
}

export function saveSession(sessionPayload) {
  const sessions = readSessions();
  const id =
    sessionPayload.id ??
    `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const payload = {
    id,
    version: 1,
    language: "javascript",
    createdAt: Date.now(),
    ...sessionPayload,
  };
  const next = [payload, ...sessions.filter((session) => session.id !== id)];
  writeSessions(next.slice(0, 50));
  return payload;
}

export function deleteSessionById(id) {
  const sessions = readSessions();
  writeSessions(sessions.filter((session) => session.id !== id));
}
