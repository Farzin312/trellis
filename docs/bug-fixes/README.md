# Bug Fixes

> Parent: [`docs/README.md`](../README.md)

Append-only register of production-affecting fixes. Every fix gets a
frontmatter-categorized entry. Entries are auto-pulled into subsystem docs.

## Template

Copy [`_template.md`](./_template.md) for each new bug fix.

File name: `YYYY-MM-DD-<slug>.md`

## Categories

| Category | When |
|----------|------|
| state-machine | Order/booking status transition bug |
| data-integrity | Data corruption, loss, or inconsistency |
| webhook | Webhook handling failure |
| env-config | Environment variable misconfiguration |
| route-404 | Route not found or misrouted |
| concurrency | Race condition or deadlock |
| money | Payment, payout, or refund error |
| rls-security | Row-level security bypass or gap |
| email | Email delivery or rendering failure |
| ui-display | Visual rendering or layout bug |
| a11y | Accessibility violation |
| docs-drift | Documentation no longer matches code |
| regression | Previously working feature broke |
| other | Does not fit above categories |
