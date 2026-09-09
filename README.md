# Preflight

A pre-sign transaction firewall for embedded wallets. Before a wallet signature ever reaches the user, Preflight decodes what the call actually does in plain English, cross-checks the target address against real on-chain approval history, computes a verdict both locally and inside a Chainlink CRE confidential workflow, and backstops the whole thing with a Privy policy that blocks the transaction at the signer level — independent of the app's own code.

Built for ETHOnline 2026.

## The problem

Approval and permit signatures are the vector behind most wallet-drain attacks, and the wallet's own signing prompt shows raw calldata, not what the call actually authorizes. A user has no way to tell "spend 100 USDC" apart from "spend an unlimited amount of USDC, forever, on behalf of an address five other wallets have already been drained by."

## How it works

```
 Wallet action requested (approve / permit / setApprovalForAll)
                    |
                    v
        Preflight intercepts before the
        wallet ever shows a signing prompt
                    |
                    v
   Decode calldata into a plain-English sentence
   (frontend/src/lib/preflight/decode.ts)
                    |
                    v
   Cross-check the spender against real approval
   history indexed by a deployed Graph subgraph
   (backend -> The Graph, backend/src/graph.ts)
                    |
                    v
   Compute a verdict: ALLOW / MANUAL_REVIEW / DENY
   (frontend/src/lib/preflight/verdict.ts)
                    |
     also computed independently inside a
     Chainlink CRE confidential workflow, using
     the same rules, over the same data, so a
     compromised frontend can't fake a clean verdict
     (workflows/preflight-audit-firewall)
                    |
                    v
   Privy wallet policy enforces the verdict at the
   signer level: even a direct API call bypassing
   the entire app is refused for a matching rule
```

Every layer above degrades safely on failure — a check that can't complete never gets reported as a pass. See `frontend/src/lib/preflight/verdict.ts` for the exact rules.

## Repo structure

| Directory | What it is |
|---|---|
| `frontend/` | Next.js app. Privy embedded wallet login, the pre-sign intercept screen, the calldata decoder and verdict engine. |
| `backend/` | Express API. Queries the deployed subgraph for a spender's approval history behind a bearer-token-gated endpoint. |
| `contracts/` | Hardhat project. `DemoToken` (ERC-20) and `DrainerDemo`, deployed to Sepolia, plus the seed script used to generate real approval history. |
| `subgraph/` | The Graph subgraph indexing `Approval` events into `Approval`/`Wallet` entities, deployed to Subgraph Studio. |
| `workflows/preflight-audit-firewall/` | Chainlink CRE confidential workflow. Ports the same verdict rules into a TEE handler that fetches a real secret and cross-checks the same backend endpoint. |

## What's live vs. what needs a real account

| Piece | Status |
|---|---|
| Privy embedded wallet login | Live. Email login produces a real Sepolia-configured embedded wallet. |
| Pre-sign intercept + decoder + verdict engine | Live, running against real deployed contracts. |
| The Graph subgraph | Live. Deployed to Subgraph Studio, indexing real Sepolia `Approval` events from five genuinely seeded throwaway wallets. |
| Backend spender-risk endpoint | Live, gated by a self-issued bearer token that the confidential workflow also uses as its real secret. |
| Chainlink CRE confidential workflow | `cre workflow simulate` verified live, twice, against real payload shapes. Live deployment to the confidential workflow DON needs Chainlink's Confidential Workflows beta access, which is still pending — this is explicitly accepted as a qualifying demonstration by Chainlink's own prize rules. |
| Privy policy backstop | Live and verified: a policy denying the seeded drainer address and any unlimited `approve()` call, tested against a real API call that bypassed the app entirely and was refused with `policy_violation`. Attached to a fresh app-controlled demo wallet rather than the primary login wallet, since updating an owned wallet's policy requires a registered cryptographic authorization key beyond this project's scope. |

## Running locally

Each subproject has its own `.env.example` — copy to `.env` (or `.env.local` for the frontend) and fill in the values, none of which are committed.

```bash
cd backend && npm install && npm run dev      # http://localhost:4000
cd frontend && npm install && npm run dev     # http://localhost:3000
```

Contracts and the subgraph are already deployed to Sepolia and Subgraph Studio respectively; redeploying is only needed if you want your own instance:

```bash
cd contracts && npm install && npm run compile
npm run deploy:sepolia   # writes contracts/deployed.sepolia.json
npm run seed:sepolia     # generates real approval history for the subgraph to index

cd subgraph && npm install && npm run codegen && npm run build
npx graph auth <your-studio-deploy-key>
npm run deploy
```

The confidential workflow:

```bash
cd workflows/preflight-audit-firewall
bun install --cwd ./my-workflow
cre workflow simulate my-workflow --target staging-settings --non-interactive --trigger-index 0
```

## Sponsor integrations

**Privy** — the entire login and signing flow. Email-only embedded wallet creation, `showWalletUIs:false` for a fully custom pre-sign screen, and a wallet-level policy that enforces the DENY verdict independent of the app.

**The Graph** — load-bearing, not decorative. The verdict engine's strongest signal (a spender with approvals from multiple distinct wallets) comes entirely from a subgraph deployed and indexing live during the event, over genuinely seeded on-chain data, not a mocked or static dataset.

**Chainlink CRE** — a confidential workflow that fetches a real secret inside a TEE, uses it to call the backend from inside the enclave, and runs the identical verdict logic the frontend runs, so the confidential compute path and the client path can never silently disagree.

## AI tools used

This project was built with Claude Code (Anthropic) as an active pair throughout the five-day build window, after kickoff. Every file under `frontend/`, `backend/`, `contracts/`, `subgraph/`, and `workflows/preflight-audit-firewall/` was written by Claude Code under direction — scoping each day's tasks, reviewing and approving consequential actions (account changes, live deployments, secret handling, form submissions), and verifying results against the real, running system (live Sepolia transactions, live subgraph queries, live `cre workflow simulate` runs, a live Privy policy denial) rather than accepting untested output.

[`docs/BUILD_LOG.md`](docs/BUILD_LOG.md) contains the verbatim prompt history, day by day, kept in this repository per ETHGlobal's AI tools disclosure rule. The full interactive build runbook — with per-task verification state and in-session findings — is a linked planning artifact: https://claude.ai/code/artifact/a892742b-d4cc-400f-9d4a-46dd2c96a78a

Commit messages and this README were written without AI attribution by design — the disclosure lives here, not scattered across git history.

## Status

All five build days complete: wallet login, the pre-sign intercept screen, the calldata decoder and verdict engine, live Graph-indexed approval history, and the Chainlink CRE confidential workflow with a live Privy policy backstop. See commit history for the day-by-day progression.
