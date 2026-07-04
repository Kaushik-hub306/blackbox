# SPEC — Blackbox

**The flight recorder for personal agents. Records everything your agent does, verifies its outputs, and alerts you when it fails silently.**
Repo: `blackbox` · License: MIT · Track: Portfolio #1 + startup seed · Target: 6–8 weeks

---

## 0. Mission & Positioning

OpenClaw-class personal agents fail *silently*: skills run without error and quietly produce wrong or missing output. Classified complaint data puts silent wrong-output at **39.1% of 16,635 user complaints** (vs 7.3% install issues). No tool addresses it; OpenClaw's own governance pushes monitoring/verification to community plugins.

Positioning: **"Your agent does things while you sleep. Blackbox is how you find out what actually happened."**
Not a security scanner (ClawHub does that). Not a sandbox. It is *observability + correctness* for personal agents.

**Product principles (non-negotiable):**
1. **Never harm the host.** Blackbox must never crash, slow, or block the agent. Every hook is wrapped; on repeated internal errors Blackbox disables itself and says so.
2. **Local-first & private.** All data stays on the user's machine by default. Dashboard binds to 127.0.0.1. No telemetry.
3. **Zero API cost to us.** LLM-judge checks use the user's own key (BYOK), sampled, with a hard daily spend cap.
4. **Five-minute quickstart.** One command, one config file, first trace visible immediately.

## 1. Scope

### P0 (MVP — milestones M0–M6)
- **Recorder:** capture every skill/tool invocation via OpenClaw plugin hooks → local SQLite.
- **Verifier engine** with 5 built-in verifiers (below), running async post-run.
- **Alerting:** Telegram, Discord, generic webhook. Deduped, severity-tagged, actionable copy.
- **Local dashboard:** run timeline, failure feed, per-skill health, full trace detail view, trace JSON export.
- **CLI:** `blackbox init`, `blackbox doctor`, `blackbox tail`, `blackbox export`.

### P1 (post-launch)
- Daily "trust digest" delivered through the agent's own channel.
- Pulse integration (forward heartbeats/failures to a Pulse monitor).
- Custom verifier plugin API (`defineVerifier()`), per-skill assertion files.
- Hosted sync + fleet dashboard (the $9–19/mo tier). Adapter for Claude Code hooks / generic MCP.

### Out of scope (v1)
Security scanning, sandboxing/permissions, prompt management, multi-user auth.

## 2. The Five P0 Verifiers

| ID | Name | Catches | Method |
|----|------|---------|--------|
| V1 | Empty/Malformed Output | Skill "succeeded" but returned nothing/garbage | Heuristics + optional per-skill JSON-schema assertions |
| V2 | Swallowed Error | Error text or non-zero tool exits inside a "success" run | Pattern bank (stack traces, `error:`, provider error shapes) + tool exit codes |
| V3 | Delivery Confirmation | "Sent" messages that never got a provider message-id | Inspect channel-send tool results for provider ack/id; flag missing/failed acks |
| V4 | Stuck/Runaway | Loops (same tool call ≥N times), runs exceeding duration/token budget | Counters over the event stream, configurable budgets |
| V5 | LLM Judge Spot-Check | Output doesn't actually satisfy the task | BYOK judge on sampled runs: rubric prompt "did the output fulfill the stated task? cite evidence." Cheap model default, temperature 0, JSON verdict |

Every verdict carries: verifier id, severity (`info|warn|fail`), human explanation, and pointers into the trace (event ids). **False-positive budget:** each verifier documents its expected FP rate on the fixture corpus; default config favors precision (alert fatigue kills the product).

## 3. Architecture

```
packages/
  core/            # recorder engine, storage, verifier runtime  → published @agenttrust/core
  verifiers/       # V1–V5 as pure functions                     → published @agenttrust/verifiers
  trace-schema/    # JSON schema v1 + TS types                   → published @agenttrust/trace-schema
  trace-player/    # React trace timeline component              → published @agenttrust/trace-player
  plugin-openclaw/ # thin adapter: OpenClaw hooks → core events
  dashboard/       # Fastify + Vite/React local web app (port 4040)
  cli/             # blackbox init/doctor/tail/export
examples/          # sample agent configs, golden-path script
fixtures/          # recorded sessions incl. seeded failures (the test corpus)
docs/              # quickstart, verifier reference, adr/, notes/
```

- **Adapter isolation:** ALL OpenClaw API surface lives in `plugin-openclaw`. Core never imports OpenClaw types. This is what makes the Claude Code/MCP adapters cheap later and protects against upstream churn (OpenClaw ships releases constantly — pin a version range, CI against it).
- **Storage:** SQLite via `better-sqlite3`, WAL mode. Async batched writes (queue drains every 250ms) so recording adds **<3ms overhead per event**. Retention: configurable, default 30 days / 2GB, auto-vacuum.
- **Redaction before persist:** built-in patterns (API keys, bearer tokens, emails, phone numbers, credit cards) + user-configurable field masks. Applied in core, not in adapters, so it can't be forgotten.
- **Config:** single `blackbox.toml` with commented sane defaults, written by `blackbox init`.

### Data model (SQLite)
```
runs(id, started_at, ended_at, skill, skill_version, session_id, channel,
     status, latency_ms, tokens_in, tokens_out, cost_usd)
events(id, run_id, seq, ts, type, payload_json)        -- type: llm_call|tool_call|tool_result|message_send|error|log
verdicts(id, run_id, verifier, severity, summary, detail_json, event_refs, created_at)
alerts(id, verdict_id, channel, sent_at, dedupe_key, status)
meta(key, value)                                        -- schema_version, install_id, etc.
```
Indexes on `runs(started_at)`, `runs(skill)`, `verdicts(severity, created_at)`. Dashboard queries must stay <200ms at 100k runs (enforced by a perf test).

### Trace Schema v1 (cross-repo contract)
`trace-schema` defines the export format: `{ trace_version: "1.0", run: {...}, events: [...], verdicts: [...] }` with strict JSON schema + generated TS types. Museum and Scorecards consume this. Additive evolution only.

## 4. Milestones & Acceptance Criteria

Each milestone ends with: CI green, `make golden` green, CHANGELOG entry, and a 3-line progress note in `docs/notes/progress.md` (fuel for build-in-public posts).

### M0 — Scaffold (days 1–2)
pnpm monorepo, strict TS, ESLint/Prettier, Vitest, GitHub Actions (typecheck+lint+test matrix), changesets, MIT license, README skeleton, `make golden` stub.
**Accept:** fresh clone → `pnpm i && pnpm test` green in CI; `blackbox --version` prints.

### M1 — Recorder (week 1)
Discovery first: read OpenClaw plugin docs; write `docs/notes/openclaw-api.md` recording the actual hook surface + version pinned. Then: `plugin-openclaw` adapter emitting normalized events → core storage. `blackbox tail` streams live runs. Fixture harness: a **mock OpenClaw runtime** in `fixtures/` that replays recorded sessions (10 sessions: 6 clean, 4 with seeded failures — empty output, swallowed error, missing delivery ack, runaway loop).
**Accept:** golden-path script replays all 10 fixture sessions → 10 runs + correct event counts in DB; data survives process restart; recording overhead measured <3ms/event (perf test in CI); kill-switch env var (`BLACKBOX_DISABLED=1`) verified.

### M2 — Verifier engine + V1–V4 (week 2)
Verifier runtime (async, post-run, never blocks agent), V1–V4 as pure functions over the trace, config-driven thresholds.
**Accept:** fixture corpus → expected-verdict table matches 100%; zero verdicts on the 6 clean sessions (precision guard); verifier reference docs generated from code.

### M3 — Alerting (week 3)
Telegram + Discord + webhook senders; dedupe (same skill+verifier within 6h collapses); severity routing (fail→alert, warn→digest-only default); actionable copy template: *"Skill 'morning-digest' produced empty output at 07:00. View trace: http://127.0.0.1:4040/runs/<id>"*.
**Accept:** induced fixture failure → exactly one alert <5s; dedupe verified; alert send failure never crashes core (wrapped, logged, retried 3×).

### M4 — Dashboard (weeks 3–4)
Fastify + React: timeline (virtualized), failure feed, per-skill health cards (success rate, last failure, avg latency/cost), trace detail (uses `trace-player`), trace JSON export button. Real design: dark, monospace data, generous empty states ("No failures yet — here's what Blackbox is watching for").
**Accept:** 100k-run seeded DB renders all views with <200ms queries; trace export validates against schema; works in Safari/Chrome/Firefox; zero-data first-run state teaches the product.

### M5 — V5 LLM Judge (week 4)
BYOK judge (Anthropic/OpenAI/Ollama providers), sampling (default 10% of runs, always-on for skills with prior failures), hard daily spend cap (default $0.50/day, counter visible in dashboard), rubric prompt versioned in repo, JSON-mode verdicts.
**Accept:** seeded wrong-output fixture (agent asked for Tuesday reservation, output says Wednesday) flagged with cited evidence; spend cap enforcement test (judge refuses past cap, surfaces "cap reached" in dashboard); judge failures degrade gracefully to "unsampled".

### M6 — Hardening, onboarding, docs (weeks 5–6)
`blackbox init`: detects OpenClaw install/config path, writes plugin entry, sends test alert, opens dashboard. `blackbox doctor`: 12 checks (plugin loaded? DB writable? hooks firing? alert channel reachable? version compat?) each with a fix suggestion. Crash-safety audit: every hook wrapped; watchdog self-disables after 5 internal errors/hour and posts one "Blackbox disabled itself" alert. Docs site (README is the quickstart; docs/ for verifier reference + config reference). Demo GIF (asciinema + dashboard capture).
**Accept:** scripted fresh-VM install test (Docker: clean OpenClaw + `blackbox init`) reaches first recorded run in <5 min without manual edits; `doctor` correctly diagnoses 6 induced misconfigurations; self-disable watchdog test passes.

### M7 — Launch (week 6+)
ClawHub listing; Show HN draft ("Show HN: Blackbox — a flight recorder for your AI agent"); landing README with 3 real catches from beta (anonymized); `launches/` folder with demo script. Private beta first: recruit 20 users from OpenClaw Discord/GitHub issues #33815/#77520 complainants at M4.
**Accept:** 20 beta installs; ≥5 real silent failures caught and confirmed by users; listing live.

## 5. Quality Bar (production definition)

- **Tests:** unit (verifiers = pure = exhaustively tested), integration (fixture replay), e2e (Dockerized real OpenClaw nightly job — allowed to be slow/flaky-quarantined), perf tests in CI (overhead + query budgets).
- **Reliability:** recording queue survives crash (WAL + replay on boot); dashboard read-only against live DB; zero data loss on SIGKILL test.
- **Security/privacy:** localhost-only default; redaction on by default; `SECURITY.md` with disclosure policy; no network calls except user-configured alert channels + BYOK judge.
- **Compatibility:** pinned OpenClaw version range in adapter; CI job against latest OpenClaw nightly that *warns* (not fails) on breakage so you hear about upstream churn within 24h.
- **Docs:** every config key documented; every verifier has a "why it fired / how to tune" page; troubleshooting guide from real beta issues.

## 6. Usability Details (the "works first try" layer)

- `init` does everything; config file is optional reading, not required.
- First-run dashboard shows a live "waiting for your agent's first run" state with a one-command test trigger.
- Alert copy always contains: skill name, what looked wrong, one-click trace link. Never raw JSON in an alert.
- `doctor` is the answer to every support question — invest in it.
- Uninstall path documented and clean (one command, data location printed).

## 7. Monetization Path (post-OSS-launch)

Free forever: local single-agent. Hosted ($9–19/mo prosumer, $49 team): encrypted sync, multi-agent fleet view, 90-day retention, digest email, Pulse bundle. Do NOT build hosted until OSS has >500 installs — the audience is the moat.

## 8. Risks & Mitigations

- **OpenClaw API churn** → adapter isolation + nightly compat job + pinned ranges.
- **Alert fatigue** → precision-first defaults, dedupe, digest routing for warns.
- **Hype cools** → core is framework-agnostic; Claude Code/MCP adapters are P1, one file each.
- **WTP unproven** → OSS-first strategy; hosted tier only after audience exists.

## 9. Prompting Opus 4.8 for this repo

Use the master-plan kickoff template. Extra rules for this repo:
- "The mock OpenClaw runtime in fixtures/ is the source of truth for tests. Never require a live agent for CI."
- "Any use of the real OpenClaw plugin API must go through packages/plugin-openclaw and be recorded in docs/notes/openclaw-api.md."
- "Verifiers are pure functions of (trace, config). If you need IO in a verifier, stop and write an ADR."
- "Overhead budget is a test, not a guideline: fail CI if event capture exceeds 3ms p95 on the benchmark fixture."
