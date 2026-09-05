"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import {
  PreflightIntercept,
  type PendingTransaction,
} from "@/components/PreflightIntercept";

export default function SendPage() {
  const { ready, authenticated, login } = usePrivy();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<PendingTransaction | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0x[a-fA-F0-9]{40}$/.test(to) || Number(amount) <= 0) {
      return;
    }
    setResult(null);
    setPending({ to: to as `0x${string}`, valueEth: amount });
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
            <button
              type="submit"
              className="rounded-full bg-foreground py-3 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Send
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
