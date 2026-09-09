# Build log and AI prompts

This is the planning/spec artifact referenced in the README's "AI tools used"
section, kept in the repository per ETHGlobal's AI tools disclosure rule:
submissions using AI assistance must include spec files, prompts, and
planning artifacts in the submission repository itself, not just describe
their use.

The full interactive version of this log — with per-task Built/Tested state,
findings, and live-verification notes — is a Claude Artifact:
https://claude.ai/code/artifact/a892742b-d4cc-400f-9d4a-46dd2c96a78a

What follows is the prompt history: the verbatim prompts that drove each
day's work, in order, and what each one produced. Full narrative findings
for each day are in the runbook above and in the commit history.

## Day 1 — Fri Sep 4

| Prompt (verbatim, in order) | What it drove |
|---|---|
| "reach carefully and start day 1" (with the runbook link) | Kicked off all of Day 1: repo creation, Next.js frontend scaffold, Express/TypeScript backend scaffold, and wiring Privy embedded-wallet login end to end. |
| "there's the link, you are not allowed to submite any project now but you can fill the form or at least some part of it" (with the ETHGlobal project-creation link) | Set the hard constraint governing the ETHGlobal draft work — fill in project details but never click final submit — and drove creating/saving the project draft (name, category, emoji, description, "how it's made", GitHub link). |
| "what did you go through the check boxes?" | A clarifying question about whether the runbook's Built/Tested checkboxes had been interacted with. |
| "update the run book of you progress and findings" | Produced the Day 1 log table and AI-disclosure finding in the runbook. |
| "test them" | Drove opening the live runbook and checking real Built/Tested checkboxes against verified Day 1 progress. |
| "under the ai usage section, since we add documenting ai use please all add prompts we use ing building" | Produced this prompt-tracking table, continued below for every subsequent day. |

## Day 2 — Sat Sep 5

| Prompt (verbatim, in order) | What it drove |
|---|---|
| "start day 2" | Built and verified the `showWalletUIs` config fix, the pre-sign screen, the send flow, and the live browser test that found the funding blocker on d2-4. |
| "so i send the fauset to this 0xDaaEA2f8e6d7c7ff41ab4c4467A4775a90c8F497 adress from my metamask wallet" / "sent it, check the balance now" | Confirmed the address, checked the balance twice, and re-ran the send flow once funded — landing the real, confirmed d2-4 transaction. |

## Day 3 — Sun Sep 6

| Prompt (verbatim, in order) | What it drove |
|---|---|
| "no lets start day 3" | Built and verified the calldata decoder, the verdict rules, the verdict UI, the `/send` scenario picker, and both a live-browser check and a local script check confirming all three verdict tiers. |

## Day 4 — Mon Sep 7

| Prompt (verbatim, in order) | What it drove |
|---|---|
| "let's do day 4" | Kicked off the demo contracts, Hardhat deploy tooling, the seed script, the subgraph schema/mapping, the backend spender-risk endpoint, and wiring the real Graph signal into the verdict UI. |
| "you the private key of my meta mask wallet?" | A clarifying question about whether the deployer private key would be typed into the conversation — answered no, with the hand-off procedure (paste directly into `contracts/.env`, never in chat). |
| "i have added it to the .evn file" | Confirmed the deploy could proceed — verified the file's structure without ever reading the key value, then ran the live Sepolia deployment. |
| "help me set this up: https://thegraph.com/studio/apikeys/?show=CreateApiKey" | Drove creating the account-level Graph API key, then locating the separate subgraph-specific deploy key. |
| "I got this error from my power shell: 'The token '&&' is not a valid statement separator...'" | Diagnosed as PowerShell 5.1's lack of `&&` support, resolved with a `;`-separated command. |
| "done" (after re-copying the deploy key) | Triggered the successful `graph deploy`, followed by live indexing verification and frontend wiring. |

## Day 5 — Tue Sep 8

| Prompt (verbatim, in order) | What it drove |
|---|---|
| "continue to day 5" | Kicked off `cre init`, reading the real SDK shape, porting the verdict rules into the enclave handler, wiring the self-issued backend secret, and two live `cre workflow simulate` runs. |
| "I don't understand what you asking me to do? should I create this secret in privy.io..." | A clarifying question about the Privy app-secret generation flow — answered step by step. |
| "Invoke-WebRequest : Parameter cannot be processed because the parameter name 'u' is ambiguous..." | Diagnosed as PowerShell's `curl` alias colliding with real curl syntax — fixed with `curl.exe` plus the `--%` stop-parsing token. |
| "{\"error\":\"Missing `privy-authorization-signature` header...\"}" | Surfaced the wallet-ownership signature requirement, which led directly to the fresh-wallet pivot. |
| (selected) "Create a fresh app-controlled demo wallet" | Set the direction for resolving d5-6/d5-7 — the `POST /v1/wallets` and `POST /v1/wallets/:id/rpc` request shapes and the two commands that produced the live denial. |
| "{\"id\":\"zpxqpm0dhnek1iecxgthdn55\",...,\"owner_id\":null,...}" | Confirmed the demo wallet was created ownerless as intended. |
| "{\"error\":\"RPC request denied due to policy violation\",\"code\":\"policy_violation\"}" | The live proof for d5-7 — Privy's own infrastructure refusing the blocked transaction, independent of all app code. |

## Day 6 — Wed Sep 9

| Prompt (verbatim, in order) | What it drove |
|---|---|
| "continue with day 6" | Kicked off the polish phase: the honest-error-state audit and fix (a failed on-chain check was silently indistinguishable from a clean one), the README rewrite, the sponsor qualification self-review, and the public-repo/commit-history check. |
| (mid-turn) forwarded a Chainlink marketing/newsletter email | Recognized as a generic newsletter, not an access grant or actionable instruction — no action taken. |
| (runbook artifact returned "not found", artifact list empty) | Surfaced the missing-artifact problem directly rather than guessing or fabricating replacement content. |
| (selected) "Recreate it fresh from what we know" | Recovered the original runbook content from this conversation's own cached history and republished it with Day 6 appended. |
| "so what's next" | Produced a prioritized list of remaining polish tasks and pre-checked the runbook's Built/Tested state for every task the logs already confirm. |
| "let's fill this form" / check-in page field list | Drafted answers for ETHGlobal's Day-6 check-in form (blockers, on-track status, prizes targeted, progress summary). |
| "the ai disclosure rule did we create readme doc for that?" (with the official rule text) | Audited the README's AI-disclosure section against ETHGlobal's three AI-tools sub-rules, found the spec/prompts artifact was only externally linked rather than included in the repository, and produced this file to close that gap. |

## Scope note

All application code in this repository — `frontend/`, `backend/`,
`contracts/`, `subgraph/`, `workflows/preflight-audit-firewall/` — was
written by Claude Code under direction, after ETHOnline 2026 kickoff.
Every consequential action (account changes, live deployments, secret
handling, form submissions) was reviewed and approved by the project author
before it happened, and every claimed behavior above was verified against
the real running system — a live Sepolia transaction, a live subgraph
query, a live `cre workflow simulate` run, a live Privy policy denial —
rather than accepted on the strength of generated code alone.
