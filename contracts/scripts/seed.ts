import { network } from "hardhat";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_WALLET_COUNT = 5;
const FUNDING_AMOUNT = "0.001";
const STAGGER_MS = 20000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { ethers } = await network.create();
  const [funder] = await ethers.getSigners();

  const deployed = JSON.parse(
    readFileSync(join(__dirname, "..", "deployed.sepolia.json"), "utf8"),
  ) as { tokenAddress: string; drainerAddress: string };

  const token = await ethers.getContractAt("DemoToken", deployed.tokenAddress);

  for (let i = 0; i < SEED_WALLET_COUNT; i++) {
    const throwaway = ethers.Wallet.createRandom().connect(ethers.provider);
    console.log(`[${i + 1}/${SEED_WALLET_COUNT}] throwaway wallet: ${throwaway.address}`);

    const fundTx = await funder.sendTransaction({
      to: throwaway.address,
      value: ethers.parseEther(FUNDING_AMOUNT),
    });
    await fundTx.wait();
    console.log(`  funded with ${FUNDING_AMOUNT} ETH: ${fundTx.hash}`);

    const approveTx = await token.connect(throwaway).approve(deployed.drainerAddress, ethers.MaxUint256);
    await approveTx.wait();
    console.log(`  approved DrainerDemo for unlimited PFDT: ${approveTx.hash}`);

    if (i < SEED_WALLET_COUNT - 1) {
      console.log(`  waiting ${STAGGER_MS / 1000}s before next wallet...`);
      await sleep(STAGGER_MS);
    }
  }

  console.log("Seed run complete.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
