export * from "./trace";
export { verifyEmptyOutput } from "./verifiers/emptyOutput";

import type { Run, Verdict } from "./trace";
import { verifyEmptyOutput } from "./verifiers/emptyOutput";

/**
 * The verifier registry. P0 ships V1; V2–V5 land in later milestones
 * (see SPEC.md §2). Each verifier is a pure `(run) => Verdict | null`.
 */
export const VERIFIERS: ReadonlyArray<(run: Run) => Verdict | null> = [
  verifyEmptyOutput,
];

/** Run every registered verifier over a run and collect the verdicts. */
export function runVerifiers(run: Run): Verdict[] {
  const verdicts: Verdict[] = [];
  for (const verify of VERIFIERS) {
    const verdict = verify(run);
    if (verdict) verdicts.push(verdict);
  }
  return verdicts;
}
