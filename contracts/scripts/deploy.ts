import { ethers } from "ethers";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

const abi = JSON.parse(readFileSync(join(process.cwd(), "build/contracts_AgentAuditLog_sol_AgentAuditLog.abi"), "utf8"));
const bytecode = "0x" + readFileSync(join(process.cwd(), "build/contracts_AgentAuditLog_sol_AgentAuditLog.bin"), "utf8").trim();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  console.log(`Deploying from: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log("Waiting for deployment...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ Deployed to: ${address}`);
  console.log(`🔍 Etherscan: https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});