import type { Run, Verdict } from "../trace";

/**
 * V1 — Empty / Malformed Output.
 *
 * Catches the single most common silent failure: a run that reports success
 * but produced no usable output. Pure function of the run; no IO.
 *
 * Precision-first by design: it only fires on runs that *claimed* success,
 * so a run that already errored (and would surface its own error) is ignored.
 */
export function verifyEmptyOutput(run: Run): Verdict | null {
  if (run.status !== "success") return null;

  const out = run.output;
  const isEmpty =
    out === null ||
    out === undefined ||
    (typeof out === "string" && out.trim().length === 0);

  if (!isEmpty) return null;

  return {
    verifier: "V1_empty_output",
    severity: "fail",
    summary: `Skill '${run.skill}' reported success but produced no output.`,
    detail: { output: out ?? null },
    eventRefs: run.events
      .filter((e) => e.type === "message_send")
      .map((e) => e.id),
  };
}
