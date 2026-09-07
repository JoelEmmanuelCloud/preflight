"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { encodeFunctionData, maxUint256, parseUnits } from "viem";
import {
  PreflightIntercept,
  type PendingTransaction,
} from "@/components/PreflightIntercept";
import { APPROVE_ABI, PERMIT_ABI, SET_APPROVAL_FOR_ALL_ABI } from "@/lib/preflight/abis";

const DEMO_TOKEN = "0x4311FaE3BE9F813575299A983Eb6FE0F52438ffd" as const;
const DEMO_DRAINER = "0x1B59495FaD2a1FB7cF4605bc62A53aadD9cA72e7" as const;
const DEMO_CLEAN_SPENDER = "0x000000000000000000000000000000000000dEaD" as const;

type Scenario =
  | "transfer"
  | "approve-bounded"
  | "approve-unlimited"
  | "revoke-all"
  | "grant-all"
  | "permit-unlimited";

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "transfer", label: "Plain ETH transfer" },
  { id: "approve-bounded", label: "Token approval — bounded (clean)" },
  { id: "approve-unlimited", label: "Token approval — unlimited (malicious pattern)" },
  { id: "revoke-all", label: "setApprovalForAll — revoke (clean)" },
  { id: "grant-all", label: "setApprovalForAll — grant all (malicious pattern)" },
  { id: "permit-unlimited", label: "Gasless permit — unlimited (malicious pattern)" },
];

function buildPending(
  scenario: Scenario,
  to: string,
  amount: string,
): PendingTransaction | null {
  if (scenario === "transfer") {
    if (!/^0x[a-fA-F0-9]{40}$/.test(to) || Number(amount) <= 0) return null;
    return { to: to as `0x${string}`, valueEth: amount };
  }

  if (scenario === "approve-bounded") {
    return {
      to: DEMO_TOKEN,
      valueEth: "0",
      data: encodeFunctionData({
        abi: APPROVE_ABI,
        functionName: "approve",
        args: [DEMO_CLEAN_SPENDER, parseUnits("100", 18)],
      }),
    };
  }

  if (scenario === "approve-unlimited") {
    return {
      to: DEMO_TOKEN,
      valueEth: "0",
      data: encodeFunctionData({
        abi: APPROVE_ABI,
        functionName: "approve",
        args: [DEMO_DRAINER, maxUint256],
      }),
    };
  }

  if (scenario === "revoke-all") {
    return {
      to: DEMO_TOKEN,
      valueEth: "0",
      data: encodeFunctionData({
        abi: SET_APPROVAL_FOR_ALL_ABI,
        functionName: "setApprovalForAll",
        args: [DEMO_DRAINER, false],
      }),
    };
  }

  if (scenario === "grant-all") {
    return {
      to: DEMO_TOKEN,
      valueEth: "0",
      data: encodeFunctionData({
        abi: SET_APPROVAL_FOR_ALL_ABI,
        functionName: "setApprovalForAll",
        args: [DEMO_DRAINER, true],
      }),
    };
  }

  return {
    to: DEMO_TOKEN,
    valueEth: "0",
    data: encodeFunctionData({
      abi: PERMIT_ABI,
      functionName: "permit",
      args: [
        DEMO_CLEAN_SPENDER,
        DEMO_DRAINER,
        maxUint256,
        BigInt(Math.floor(Date.now() / 1000) + 3600),
        27,
        `0x${"00".repeat(32)}`,
        `0x${"00".repeat(32)}`,
      ],
    }),
  };
}

export default function SendPage() {
  const { ready, authenticated, login } = usePrivy();
  const [scenario, setScenario] = useState<Scenario>("transfer");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<PendingTransaction | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = buildPending(scenario, to, amount);
    if (!next) return;
    setResult(null);
    setPending(next);
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Log in to send a transfer.</p>
        <button
          onClick={login}
          className="rounded-full bg-foreground px-5 py-3 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Log in with email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-black dark:text-zinc-50">
            Send ETH
          </h1>
          <Link href="/" className="text-sm text-zinc-500 underline">
            Back
          </Link>
        </div>

        {pending ? (
          <PreflightIntercept
            pending={pending}
            onApprove={(hash) => {
              setResult(hash);
              setPending(null);
            }}
            onReject={() => setPending(null)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              Scenario
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            {scenario === "transfer" && (
              <>
                <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Recipient address
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="0x..."
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Amount (ETH)
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.01"
                    inputMode="decimal"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </label>
              </>
            )}

            {scenario !== "transfer" && (
              <p className="text-xs text-zinc-500">
                Demo calldata targeting the real DemoToken/DrainerDemo
                contracts deployed to Sepolia — the unlimited/grant-all
                scenarios target an address with real seeded approval
                history on the deployed subgraph.
              </p>
            )}

            <button
              type="submit"
              className="rounded-full bg-foreground py-3 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Review
            </button>
          </form>
        )}

        {result && (
          <p className="break-all text-sm text-zinc-500">
            Sent. Tx hash: {result}
          </p>
        )}
      </main>
    </div>
  );
}
