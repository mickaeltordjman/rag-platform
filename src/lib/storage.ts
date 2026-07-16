import type { CaseSession, DiagnosticAnswer, ReaderProfile, StudyState } from "./study";
import { deterministicArm } from "./study";

const STORAGE_KEY = "rag-dx-study-v1";

export function loadState(): StudyState {
  if (typeof window === "undefined") return { sessions: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { sessions: {} };
  } catch {
    return { sessions: {} };
  }
}

export function saveState(state: StudyState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function saveReader(reader: ReaderProfile): StudyState {
  const state = loadState();
  const next = { ...state, reader };
  saveState(next);
  return next;
}

export function ensureSession(caseId: string): CaseSession {
  const state = loadState();
  const existing = state.sessions[caseId];
  if (existing) return existing;
  const readerId = state.reader?.studyId || "demo-reader";
  const session: CaseSession = {
    caseId,
    arm: deterministicArm(readerId, caseId),
    phase: "baseline",
    openedAt: new Date().toISOString(),
    messages: [],
  };
  state.sessions[caseId] = session;
  saveState(state);
  return session;
}

export function submitAnswer(caseId: string, phase: "baseline" | "final", answer: DiagnosticAnswer): CaseSession {
  const state = loadState();
  const session = state.sessions[caseId] || ensureSession(caseId);
  if (phase === "baseline") {
    session.baseline = answer;
    session.phase = "ai";
    session.aiUnlockedAt = new Date().toISOString();
  } else {
    session.final = answer;
    session.phase = "completed";
    session.completedAt = new Date().toISOString();
  }
  state.sessions[caseId] = session;
  saveState(state);
  return session;
}

export function updateSession(caseId: string, updater: (session: CaseSession) => CaseSession): CaseSession {
  const state = loadState();
  const session = state.sessions[caseId] || ensureSession(caseId);
  const next = updater(session);
  state.sessions[caseId] = next;
  saveState(state);
  return next;
}

export function clearStudy(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
