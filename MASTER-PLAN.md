# MASTER PLAN — The Agent Trust Suite

**Five repos. One thesis: agents shipped faster than trust. You're building the trust layer.**
Version 1.0 · July 2026 · Solo dev, full-time · Built with Claude Opus 4.8

---

## 1. The Five Projects

| # | Repo | One-liner | Track | Est. |
|---|------|-----------|-------|------|
| 01 | `blackbox` | Flight recorder + silent-failure detection for OpenClaw agents | Both | 6–8 wk |
| 02 | `silent-failure-museum` | Interactive gallery of real, replayable agent disasters | Portfolio | 2–3 wk |
| 03 | `skill-scorecards` | "Consumer Reports" for ClawHub skills — automated correctness battery + public rankings | Both | 4–6 wk |
| 04 | `pulse` | Hosted uptime + delivery-confirmation monitor for scheduled agents | Money | 3–4 wk |
| 05 | `ai-bom` | CLI that scans a codebase → full inventory of model calls, prompts, providers, cost exposure | Both | 4–6 wk |

## 2. Why They Interlock (the flywheel)

```
Museum (attention)  →  Scorecards (credibility)  →  Blackbox (product)
        ↑                                               ↓
        └──── exhibits come from Blackbox catches ──────┘
                     Pulse (recurring revenue utility, integrates with Blackbox alerts)
                     AI-BOM (standalone B2B wedge, shares launch audience)
```

- **Museum** is launch content: it makes "silent agent failure" a named, visible problem — the problem Blackbox solves.
- **Scorecards** proves your verifier engine at scale (10K+ skills) and earns neutral-authority status in the OpenClaw ecosystem.
- **Blackbox** is the flagship: the OSS product people install after the Museum scared them and Scorecards convinced them.
- **Pulse** is the fastest path to paying customers; Blackbox ships a one-click Pulse integration.
- **AI-BOM** reaches a different buyer (eng leads/compliance) with the same "AI accountability" brand.

## 3. Cross-Repo Contracts (define once, never break)

1. **Trace Schema v1** — versioned JSON schema for recorded agent runs. Owned by `blackbox`, published as `@agenttrust/trace-schema`. Consumed by Museum (replay player) and Scorecards (evidence traces). Frozen fields; additive changes only; breaking changes = v2 + migration notes.
2. **Verifier Engine** — published from `blackbox` as `@agenttrust/verifiers` (pure functions: `verify(trace, config) → Verdict[]`). Consumed by Scorecards' battery runner.
3. **Trace Player** — React component published from `blackbox` as `@agenttrust/trace-player`. Consumed by Museum and Scorecards' evidence pages.
4. **Pulse Ping API** — public HTTP contract (`POST /api/ping/:token` with `start|success|fail`). Blackbox's alerting can forward to it; documented in `pulse` README, never breaks without `/v2`.
5. **No shared databases. No shared deploys.** Repos couple only through published npm packages and public HTTP APIs.

## 4. Shared Engineering Conventions (all repos)

- **Language:** TypeScript everywhere (strict mode). Node 22 LTS. pnpm. ESM only.
- **Quality gates (CI on every PR):** typecheck, ESLint, Prettier check, Vitest unit+integration, `make golden` (golden-path smoke script — the "works first try" guarantee).
- **Testing doctrine:** fixture-driven. **No live API calls in tests** — record fixtures once, replay deterministically. Engine code is test-first.
- **Releases:** Changesets + semver. `CHANGELOG.md` maintained from day one.
- **Repo hygiene:** MIT license · README with a <5-minute quickstart and demo GIF · `.env.example` · `SECURITY.md` · `CONTRIBUTING.md` · issue templates · `docs/adr/` for architecture decisions.
- **Privacy defaults:** telemetry OFF by default; local-first wherever possible; secrets redaction ON by default.
- **Design bar:** every user-facing surface (dashboard, site, report) gets real typography, empty states that teach, and copy written for humans. Ugly kills trust products.

## 5. Build Order & Timeline

Per your call: **Blackbox first.** Recommended sequence (aggressive but realistic full-time):

| Weeks | Repo | Milestone target |
|-------|------|------------------|
| 1–6 | `blackbox` | M0→M6: recorder, verifiers, alerts, dashboard, hardening. Private beta w/ 20 users from OpenClaw Discord by week 4. |
| 7–8 | `silent-failure-museum` | Full build + **launch #1** (Show HN). Museum links "what would have caught this" → Blackbox. |
| 8 | `blackbox` | **Launch #2**: OSS release + ClawHub listing, riding Museum traffic. |
| 9–11 | `skill-scorecards` | Battery + site. **Launch #3**: "We tested 500 ClawHub skills" post. |
| 12–14 | `pulse` | Full build + billing. **Launch #4**. First recurring revenue. |
| 15–19 | `ai-bom` | Scanner + GitHub Action. **Launch #5**: "We scanned 20 popular agent repos" post. |

Swap Pulse earlier (weeks 1–3) if you want revenue before audience. The specs are independent enough to reorder.

## 6. How to Drive Opus 4.8 (the build loop)

Work **one repo per session** (or per git worktree). For each milestone:

1. Open a fresh session in the repo. Paste the repo's SPEC file (it fits in context) + the kickoff prompt below.
2. Instruct: **build milestone N only.** No scope creep. Deviations require a one-paragraph ADR in `docs/adr/`.
3. Agent writes failing tests first for engine code, then implements until green.
4. Run `make golden` (each spec defines it). The golden path must pass before commit.
5. Commit (conventional commits). You review the diff — you are the reviewer of record.
6. Next milestone. Never skip acceptance criteria; they are the definition of done.

**Session rules that keep quality high:**
- "If a dependency or API surface is undocumented, write a discovery note in `docs/notes/` before coding against it."
- "Prefer boring technology. Every new dependency needs a one-line justification in the ADR."
- "All errors must be actionable: what happened, why probably, what to do next."
- "When a milestone is done, output: what shipped, what's tested, what's deliberately deferred."

## 7. Kickoff Prompt Template (paste at the start of every build session)

```
You are building <REPO NAME> — <one-liner>. The complete spec follows this prompt.

Operating rules:
1. Build MILESTONE <N> only. Do not implement future milestones.
2. Test-first for all engine/core code. No live API calls in tests — use the fixtures directory.
3. Acceptance criteria in the spec are the definition of done. Run them before declaring done.
4. Keep `make golden` green. If you must deviate from the spec, write docs/adr/NNN-<topic>.md (one paragraph) and proceed.
5. TypeScript strict, ESM, Node 22, pnpm. Errors must be actionable. No telemetry. Redact secrets by default.
6. When done: summarize what shipped, test coverage of new code, and anything deferred.

<PASTE SPEC.md HERE>
```

## 8. Launch Cadence (build in public)

- Post weekly progress on X from day 1 (screenshots > words; failures > wins).
- Each repo has a designated launch artifact (defined in its spec §Launch).
- Keep a `launches/` folder in each repo: Show HN draft, screenshots, demo script — written BEFORE launch week, refined after beta feedback.
- Collect every real silent-failure catch from beta users (anonymized) — they are Museum exhibits, launch tweets, and landing-page proof.

## 9. Honesty Constraints (protect your credibility)

- Museum exhibits and Scorecards claims must be **sourced or reproducible**; reconstructions labeled as reconstructions.
- AI-BOM's EU-AI-Act mapping is "compliance-support tooling," never legal advice — say so in the report footer.
- Publish Scorecards' methodology and dispute process before publishing any rankings.
