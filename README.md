# MTN-Agent — Verified Agent Commerce Demo

A working prototype of the authorisation layer underpinning agentic commerce. An AI agent receives a purchasing task, autonomously selects merchants, validates each transaction against a user-defined policy, and logs every decision to an audit trail.

**Live demo:** https://mtn-agent.vercel.app

## What it demonstrates

- AI agent makes real purchasing decisions autonomously
- Policy engine controls what the agent can and cannot do (spending limits, categories, kill switch)
- Every decision logged to an immutable audit trail
- Human-in-the-loop escalation for high-value transactions
- Architecture mirrors what Mastercard Agent Pay is commercialising at scale

## Architecture

User Policy Dashboard
│
▼
Claude Agent Console  ──(task)──▶  Claude 3.5 (via Anthropic API)
│
MCP Tools (5)
│
┌───────────┴───────────┐
▼                       ▼
Policy Engine           Supabase
APPROVED/REJECTED/        Audit Log +
ESCALATED            Pending Approvals

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **AI agent:** Claude via Anthropic API
- **Policy + audit store:** Supabase (Postgres)
- **Hosting:** Vercel

## Demo tasks

- "Order lunch for under €15" → APPROVED
- "Find me the cheapest flight to London and book it" → ESCALATED (exceeds approval threshold)
- "Book the Hilton Dublin for 6 nights" → ESCALATED (€1,260 requires human approval)

## Why this matters

The central unsolved problem in agentic commerce is trust. When an AI agent attempts to make a purchase on your behalf, the payment network needs to know: is this agent authorised? Under what constraints? What did it do, and can I audit it? That is the Agent Pay problem. This demo builds the authorisation and trust layer that sits between an AI agent and the payment rail.

## Author

Phillip Martin — [LinkedIn](https://linkedin.com/in/your-profile)