# Security Policy

Blackbox handles agent execution traces that can contain sensitive data, so we take this seriously.

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Instead, open a
[private security advisory](https://github.com/Kaushik-hub306/blackbox/security/advisories/new)
or email the maintainer listed on the GitHub profile. We aim to acknowledge
reports within 72 hours.

## Data-handling commitments

- **Local-first:** by default all traces are stored locally (SQLite) and never leave the machine.
- **Redaction on by default:** API keys, bearer tokens, emails, phone numbers, and card-shaped
  numbers are redacted before persistence; additional field masks are configurable.
- **No telemetry:** Blackbox makes no outbound network calls except to alert channels you
  configure and, for the optional LLM-judge verifier, the model provider whose key you supply.
- **Localhost-bound dashboard:** the dashboard binds to `127.0.0.1` and is read-only against the store.

## Scope

Because Blackbox observes another program (your agent), a core safety property is that it must
never crash, block, or slow the host agent. Reports demonstrating a way to make the recorder
degrade the monitored agent are in scope and treated as high severity.
