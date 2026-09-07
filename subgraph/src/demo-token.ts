import { BigInt } from "@graphprotocol/graph-ts";
import { Approval as ApprovalEvent } from "../generated/DemoToken/DemoToken";
import { Approval, Wallet } from "../generated/schema";

const UNLIMITED_THRESHOLD = BigInt.fromI32(2).pow(255);

export function handleApproval(event: ApprovalEvent): void {
  const ownerId = event.params.owner.toHexString();
  let wallet = Wallet.load(ownerId);
  if (wallet == null) {
    wallet = new Wallet(ownerId);
    wallet.firstSeenAt = event.block.timestamp;
    wallet.save();
  }

  const approvalId = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString();
  const approval = new Approval(approvalId);
  approval.owner = ownerId;
  approval.spender = event.params.spender;
  approval.token = event.address;
  approval.amount = event.params.value;
  approval.unlimited = event.params.value >= UNLIMITED_THRESHOLD;
  approval.timestamp = event.block.timestamp;
  approval.txHash = event.transaction.hash;
  approval.save();
}
