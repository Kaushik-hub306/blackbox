/**
 * Trace Schema v1 — the cross-repo contract.
 *
 * This is the versioned shape of a recorded agent run. It is deliberately
 * small and additive-only: new optional fields may be added within v1, but
 * existing fields never change meaning. Breaking changes require a v2 schema
 * plus a migration note (see docs/adr/).
 *
 * Consumers: silent-failure-museum (replay), skill-scorecards (evidence).
 */

export const TRACE_VERSION = "1.0" as const;

export type RunStatus = "success" | "error" | "running";

export type EventType =
  | "llm_call"
  | "tool_call"
  | "tool_result"
  | "message_send"
  | "error"
  | "log";

export interface TraceEvent {
  /** Stable id, unique within a run. */
  id: string;
  /** Monotonic ordering within the run, starting at 0. */
  seq: number;
  /** Unix epoch milliseconds. */
  ts: number;
  type: EventType;
  payload: Record<string, unknown>;
}

export interface Run {
  id: string;
  skill: string;
  skillVersion?: string;
  sessionId?: string;
  /** Delivery channel, e.g. "telegram" | "discord" | "email". */
  channel?: string;
  status: RunStatus;
  /** Unix epoch milliseconds. */
  startedAt: number;
  endedAt?: number;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  /**
   * The user-visible result the run produced, if the adapter can capture one.
   * `null` means the run declared success but produced nothing.
   */
  output?: string | null;
  events: TraceEvent[];
}

export type Severity = "info" | "warn" | "fail";

export interface Verdict {
  /** Verifier id, e.g. "V1_empty_output". */
  verifier: string;
  severity: Severity;
  /** One human-readable sentence suitable for an alert. */
  summary: string;
  /** Optional structured detail for the dashboard. */
  detail?: Record<string, unknown>;
  /** Ids of TraceEvents that support this verdict. */
  eventRefs?: string[];
}

export interface Trace {
  traceVersion: typeof TRACE_VERSION;
  run: Run;
  verdicts: Verdict[];
}

/** Total ordering over severities. */
function severityRank(s: Severity): number {
  return s === "fail" ? 2 : s === "warn" ? 1 : 0;
}

/** Returns the highest severity across verdicts, or null when there are none. */
export function worstSeverity(verdicts: readonly Verdict[]): Severity | null {
  let worst: Severity | null = null;
  for (const v of verdicts) {
    if (worst === null || severityRank(v.severity) > severityRank(worst)) {
      worst = v.severity;
    }
  }
  return worst;
}

/** Convenience constructor used by adapters and tests. */
export function makeRun(partial: Partial<Run> & Pick<Run, "id" | "skill">): Run {
  return {
    status: "success",
    startedAt: 0,
    events: [],
    ...partial,
  };
}
