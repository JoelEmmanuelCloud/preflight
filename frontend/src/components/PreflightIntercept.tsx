"use client";

import { useEffect, useMemo, useState } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { parseEther } from "viem";
import { decodeCalldata, getSpenderAddress } from "@/lib/preflight/decode";
import { computeVerdict, type Verdict } from "@/lib/preflight/verdict";
import { fetchSpenderRisk, type SpenderRisk } from "@/lib/preflight/graphSignal";

export interface PendingTransaction {
  to: `0x${string}`;
  valueEth: string;
  data?: `0x${string}`;
}

interface PreflightInterceptProps {
  pending: PendingTransaction;
  onApprove: (txHash: string) => void;
  onReject: () => void;
}

const VERDICT_STYLES: Record<
  Verdict,
  { label: string; badge: string; box: string }
> = {
  ALLOW: {
    label: "Looks safe",
    badge: "bg-emerald-500/15 text-emerald-400",
    box: "border-emerald-900 bg-emerald-950/40",
  },
  MANUAL_REVIEW: {
    label: "Needs a closer look",
    badge: "bg-amber-500/15 text-amber-400",
    box: "border-amber-900 bg-amber-950/40",
  },
  DENY: {
    label: "This is a drainer pattern",
    badge: "bg-red-500/15 text-red-400",
    box: "border-red-900 bg-red-950/40",
  },
};

export function PreflightIntercept({
  pending,
  onApprove,
  onReject,
}: PreflightInterceptProps) {
  const { sendTransaction } = useSendTransaction();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decoded = useMemo(
    () => decodeCalldata(pending.data ?? "0x", pending.valueEth),
    [pending.data, pending.valueEth],
  );
  const spender = useMemo(() => getSpenderAddress(decoded), [decoded]);

  const [fetchedRisk, setFetchedRisk] = useState<{ spender: string; risk: SpenderRisk | null; failed: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!spender) return;
    let cancelled = false;
    fetchSpenderRisk(spender)
      .then((risk) => {
        if (!cancelled) setFetchedRisk({ spender, risk, failed: false });
      })
      .catch(() => {
        if (!cancelled) setFetchedRisk({ spender, risk: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [spender]);

  const riskForSpender = spender && fetchedRisk?.spender === spender ? fetchedRisk : null;
  const spenderRisk = riskForSpender?.risk ?? null;
  const spenderRiskUnavailable = riskForSpender?.failed ?? false;
  const checkingHistory = spender !== null && fetchedRisk?.spender !== spender;

  const { verdict, reasons } = useMemo(
    () => computeVerdict(decoded, spenderRisk, spenderRiskUnavailable),
    [decoded, spenderRisk, spenderRiskUnavailable],
  );
  const style = VERDICT_STYLES[verdict];
  const approveIsPrimary = verdict === "ALLOW";

  const handleApprove = async () => {
    setSending(true);
    setError(null);
    try {
      const { hash } = await sendTransaction({
        to: pending.to,
        value: parseEther(pending.valueEth || "0"),
        data: pending.data,
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
      <p className="text-lg font-medium text-zinc-50">{decoded.sentence}</p>

      {checkingHistory && (
        <p className="text-sm text-zinc-500">Checking this transaction against on-chain history...</p>
      )}

      <div className={`rounded-xl border p-4 ${style.box}`}>
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
          {style.label}
        </span>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-zinc-400">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

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
          className={
            approveIsPrimary
              ? "flex-1 rounded-full border border-zinc-700 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 disabled:opacity-50"
              : "flex-1 rounded-full bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          }
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={sending}
          className={
            approveIsPrimary
              ? "flex-1 rounded-full bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
              : "flex-1 rounded-full border border-zinc-700 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 disabled:opacity-50"
          }
        >
          {sending ? "Sending..." : approveIsPrimary ? "Approve" : "Approve anyway"}
        </button>
      </div>
    </div>
  );
}
