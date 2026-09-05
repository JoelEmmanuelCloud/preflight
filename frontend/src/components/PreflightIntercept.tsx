"use client";

import { useState } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { parseEther } from "viem";

export interface PendingTransaction {
  to: `0x${string}`;
  valueEth: string;
}

interface PreflightInterceptProps {
  pending: PendingTransaction;
  onApprove: (txHash: string) => void;
  onReject: () => void;
}

export function PreflightIntercept({
  pending,
  onApprove,
  onReject,
}: PreflightInterceptProps) {
  const { sendTransaction } = useSendTransaction();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setSending(true);
    setError(null);
    try {
      const { hash } = await sendTransaction({
        to: pending.to,
        value: parseEther(pending.valueEth),
      });
      onApprove(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <p className="text-lg font-medium text-zinc-50">
        You&apos;re about to send {pending.valueEth} ETH to{" "}
        <span className="break-all font-mono text-zinc-300">{pending.to}</span>
      </p>

      <details className="text-sm text-zinc-500">
        <summary className="cursor-pointer select-none">Raw details</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-black p-3 text-xs text-zinc-400">
          {JSON.stringify(pending, null, 2)}
        </pre>
      </details>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onReject}
          disabled={sending}
          className="flex-1 rounded-full border border-zinc-700 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={sending}
          className="flex-1 rounded-full bg-foreground py-3 text-sm text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {sending ? "Sending..." : "Approve"}
        </button>
      </div>
    </div>
  );
}
