import type { DecodedCall } from "./decode";
import type { SpenderRisk } from "./graphSignal";

export type Verdict = "ALLOW" | "DENY" | "MANUAL_REVIEW";

export interface VerdictResult {
  verdict: Verdict;
  reasons: string[];
}

const REPEAT_SPENDER_WALLET_THRESHOLD = 2;

export function computeVerdict(decoded: DecodedCall, spenderRisk?: SpenderRisk | null): VerdictResult {
  if (decoded.kind === "unknown") {
    return {
      verdict: "MANUAL_REVIEW",
      reasons: ["Preflight could not decode this call against any known function signature."],
    };
  }

  if (decoded.kind === "transfer") {
    return {
      verdict: "ALLOW",
      reasons: ["This is a one-time transfer, not a standing approval."],
    };
  }

  if (decoded.kind === "setApprovalForAll" && !decoded.approved) {
    return {
      verdict: "ALLOW",
      reasons: ["This revokes access rather than granting it."],
    };
  }

  const reasons: string[] = [
    "This grants standing, repeatable access rather than a one-time transfer.",
  ];

  if (spenderRisk && spenderRisk.distinctWallets >= REPEAT_SPENDER_WALLET_THRESHOLD) {
    reasons.push(
      `${spenderRisk.distinctWallets} other wallets have granted this same address standing approvals — a known drainer pattern.`,
    );
    return { verdict: "DENY", reasons };
  }

  if (decoded.unlimitedAmount) {
    reasons.push("The amount is effectively unlimited.");
    return { verdict: "DENY", reasons };
  }

  reasons.push("The amount is bounded, but standing access still needs a human decision.");
  return { verdict: "MANUAL_REVIEW", reasons };
}
