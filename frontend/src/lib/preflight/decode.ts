import { decodeFunctionData, maxUint256, type Hex } from "viem";
import { APPROVE_ABI, PERMIT_ABI, SET_APPROVAL_FOR_ALL_ABI } from "./abis";

export type DecodedCall =
  | {
      kind: "transfer";
      sentence: string;
      standingAccess: false;
      unlimitedAmount: false;
    }
  | {
      kind: "approve";
      spender: `0x${string}`;
      amount: bigint;
      sentence: string;
      standingAccess: true;
      unlimitedAmount: boolean;
    }
  | {
      kind: "setApprovalForAll";
      operator: `0x${string}`;
      approved: boolean;
      sentence: string;
      standingAccess: boolean;
      unlimitedAmount: boolean;
    }
  | {
      kind: "permit";
      owner: `0x${string}`;
      spender: `0x${string}`;
      value: bigint;
      deadline: bigint;
      sentence: string;
      standingAccess: true;
      unlimitedAmount: boolean;
    }
  | {
      kind: "unknown";
      sentence: string;
      standingAccess: true;
      unlimitedAmount: true;
    };

const UNLIMITED_THRESHOLD = maxUint256 / BigInt(2);

function isEffectivelyUnlimited(amount: bigint): boolean {
  return amount >= UNLIMITED_THRESHOLD;
}

export function decodeCalldata(data: Hex, valueEth: string): DecodedCall {
  if (!data || data === "0x") {
    return {
      kind: "transfer",
      sentence: `Send ${valueEth} ETH.`,
      standingAccess: false,
      unlimitedAmount: false,
    };
  }

  try {
    const { args } = decodeFunctionData({ abi: APPROVE_ABI, data });
    const [spender, amount] = args;
    const unlimited = isEffectivelyUnlimited(amount);
    return {
      kind: "approve",
      spender,
      amount,
      standingAccess: true,
      unlimitedAmount: unlimited,
      sentence: unlimited
        ? `This lets ${spender} spend an unlimited amount of this token from your wallet, indefinitely.`
        : `This lets ${spender} spend up to ${amount.toString()} of this token from your wallet.`,
    };
  } catch {}

  try {
    const { args } = decodeFunctionData({ abi: SET_APPROVAL_FOR_ALL_ABI, data });
    const [operator, approved] = args;
    return {
      kind: "setApprovalForAll",
      operator,
      approved,
      standingAccess: approved,
      unlimitedAmount: approved,
      sentence: approved
        ? `This gives ${operator} permission to transfer every token you own in this collection, at any time, until you revoke it.`
        : `This revokes ${operator}'s standing permission to transfer tokens in this collection.`,
    };
  } catch {}

  try {
    const { args } = decodeFunctionData({ abi: PERMIT_ABI, data });
    const [owner, spender, value, deadline] = args;
    const unlimited = isEffectivelyUnlimited(value);
    return {
      kind: "permit",
      owner,
      spender,
      value,
      deadline,
      standingAccess: true,
      unlimitedAmount: unlimited,
      sentence: unlimited
        ? `This signs a gasless permission letting ${spender} spend an unlimited amount of this token from your wallet — no wallet popup would normally warn you about this.`
        : `This signs a gasless permission letting ${spender} spend up to ${value.toString()} of this token from your wallet.`,
    };
  } catch {}

  return {
    kind: "unknown",
    sentence: "Preflight doesn't recognize this function call and can't confirm what it actually does.",
    standingAccess: true,
    unlimitedAmount: true,
  };
}
