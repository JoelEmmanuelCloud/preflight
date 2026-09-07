import { network } from "hardhat";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const { ethers } = await network.create();

  const initialSupply = ethers.parseUnits("1000000", 18);
  const token = await ethers.deployContract("DemoToken", [initialSupply]);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("DemoToken deployed to:", tokenAddress);

  const drainer = await ethers.deployContract("DrainerDemo");
  await drainer.waitForDeployment();
  const drainerAddress = await drainer.getAddress();
  console.log("DrainerDemo deployed to:", drainerAddress);

  const deployTx = token.deploymentTransaction();
  const receipt = deployTx ? await deployTx.wait() : null;

  const out = {
    tokenAddress,
    drainerAddress,
    startBlock: receipt ? receipt.blockNumber : null,
    deployedAt: new Date().toISOString(),
  };
  writeFileSync(join(__dirname, "..", "deployed.sepolia.json"), JSON.stringify(out, null, 2));
  console.log("Wrote deployed.sepolia.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
