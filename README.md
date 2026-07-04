# Blackbox 🛑📼

**A flight recorder for your AI agent.** Blackbox records everything your agent does, verifies its outputs, and alerts you when it fails *silently* — the skill that "succeeded" but sent nothing, confirmed a booking that never happened, or quietly returned the wrong answer.

> Personal agents fail by silence. In a classified sample of 16,635 real ecosystem complaints, **39.1%** were *silent wrong / missing output* — versus 7.3% for install problems. Security scanners exist. A correctness recorder didn't. This is that.

---

## Status: `M0` — foundation

This repository is at **Milestone 0** of the build plan in [`SPEC.md`](./SPEC.md). What's here today is real and green:

- **Trace Schema v1** (`src/trace.ts`) — the versioned run format the whole suite shares.
- **Verifier engine** (`src/index.ts`) with **V1 — Empty/Malformed Output** (`src/verifiers/emptyOutput.ts`) as a pure, fully-tested function.
- CI that typechecks and tests on every push.

V2–V5 (swallowed error, delivery confirmation, stuck/runaway, LLM-judge spot-check), the OpenClaw recorder adapter, alerting, and the local dashboard land in subsequent milestones — each specced with acceptance criteria in `SPEC.md`.

## Quickstart

```bash
npm install
npm run typecheck   # tsc --noEmit, strict
npm test            # vitest — V1 verifier suite
```

## The idea in one function

A verifier is a pure function of a recorded run:

```ts
import { runVerifiers, makeRun } from "@agenttrust/blackbox";

const run = makeRun({ id: "r1", skill: "morning-digest", status: "success", output: "" });
runVerifiers(run);
// → [{ verifier: "V1_empty_output", severity: "fail",
//      summary: "Skill 'morning-digest' reported success but produced no output." }]
```

Because verifiers are pure, they are trivially testable, replayable over recorded traces, and safe to run off the hot path — Blackbox never blocks or slows your agent.

## Design principles (non-negotiable)

1. **Never harm the host.** Recording is async and wrapped; on repeated internal errors Blackbox disables itself and says so.
2. **Local-first & private.** Data stays on your machine by default; the dashboard binds to `127.0.0.1`; no telemetry.
3. **Zero API cost to us.** The LLM-judge verifier uses *your* key (BYOK), sampled, with a hard daily spend cap.
4. **Five-minute quickstart.** `blackbox init` will do everything; the config file is optional reading.

## The five verifiers

| ID | Name | Catches |
|----|------|---------|
| **V1** ✅ | Empty / Malformed Output | "Success" with nothing usable produced |
| V2 | Swallowed Error | Error text / non-zero tool exits inside a "success" run |
| V3 | Delivery Confirmation | "Sent" messages with no provider message id |
| V4 | Stuck / Runaway | Loops and runs blowing past time/token budgets |
| V5 | LLM Judge Spot-Check | Output that doesn't actually satisfy the task |

## Repository layout (target)

See [`SPEC.md`](./SPEC.md) for the full architecture. M0 ships a single package; the `packages/*` split (`@agenttrust/core`, `/verifiers`, `/trace-schema`, `/trace-player`, `plugin-openclaw`, `dashboard`, `cli`) is introduced at M1.

## License

MIT — see [`LICENSE`](./LICENSE). Part of the **Agent Trust Suite**.
