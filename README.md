# MTN-Agent — Verified Agent Commerce Demo

A working prototype of the authorisation layer underpinning agentic commerce. An AI agent receives a purchasing task, autonomously selects merchants, validates each transaction against a user-defined policy, and logs every decision to an immutable on-chain audit trail.

**Live demo:** https://mtn-agent.vercel.app  
**Smart contract:** [0x17f8b0D63Ec30eF656fe711D6A1eC4f6D0794Fea](https://sepolia.etherscan.io/address/0x17f8b0D63Ec30eF656fe711D6A1eC4f6D0794Fea)  
**Demo video:** *(add after recording)*

---

## Why this matters

The central unsolved problem in agentic commerce is trust. When an AI agent attempts to make a purchase on your behalf, the payment network needs three things instantly:

1. Is this agent authorised to spend?
2. Under what constraints?
3. What did it do, and can I audit it?

That is the Agent Pay problem. MTN-Agent builds the authorisation and trust layer that sits between an AI agent and the payment rail — the exact layer Mastercard is commercialising at scale.

---

## Architecture


User Policy Dashboard
│
▼
Claude Agent Console  ──(task)──▶  Claude (via Anthropic API)
│
MCP Tools (5)
│
┌───────────┴───────────┐
▼                       ▼
Policy Engine           Supabase
APPROVED/REJECTED/        Audit Log +
ESCALATED            Pending Approvals
│
▼
Ethereum Sepolia
Immutable On-Chain
Audit Trail

---

## Demo tasks

- *"Order lunch for under €15"* → APPROVED, logged on-chain
- *"Find me the cheapest flight to London"* → ESCALATED (exceeds approval threshold)
- *"Book the Hilton Dublin for 6 nights"* → ESCALATED (€1,260 requires human approval)

Change the policy mid-demo and the agent's behaviour changes instantly.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI agent | Claude via Anthropic API |
| Agent tools | MCP (Model Context Protocol) |
| Policy + audit store | Supabase (Postgres) |
| Blockchain | Ethereum Sepolia testnet |
| Smart contract | Solidity (~40 lines) |
| Hosting | Vercel |

---

## What production would look like

- Real merchant directory via payment network APIs
- Agent identity and credential framework (W3C DIDs or similar)
- Production chain instead of Sepolia
- Multi-agent orchestration with shared policy layer

The MCP interface doesn't change — the architecture scales.

---

## Author

Phillip Martin  
[LinkedIn](https://linkedin.com/in/your-profile) · [GitHub](https://github.com/PMships)
