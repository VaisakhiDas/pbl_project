const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

const FRONTEND_CONTRACTS_DIR = path.join(__dirname, "..", "frontend", "src", "contracts");

async function main() {
  console.log(`Deploying EnergyTrading to network: ${network.name}`);

  const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
  const energyTrading = await EnergyTrading.deploy();
  await energyTrading.waitForDeployment();

  const address = await energyTrading.getAddress();
  console.log(`EnergyTrading deployed at: ${address}`);

  // Write ABI + address so the frontend can pick it up without any manual copy step.
  const artifact = await require("hardhat").artifacts.readArtifact("EnergyTrading");

  fs.mkdirSync(FRONTEND_CONTRACTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(FRONTEND_CONTRACTS_DIR, "EnergyTrading.json"),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );
  fs.writeFileSync(
    path.join(FRONTEND_CONTRACTS_DIR, "contract-address.json"),
    JSON.stringify({ address, network: network.name, chainId: network.config.chainId }, null, 2)
  );

  console.log("Wrote ABI and address to frontend/src/contracts/");

  // Seed a couple of demo accounts so the marketplace isn't empty on first run.
  if (network.name === "localhost" || network.name === "hardhat") {
    const [, seedProducer, seedProducer2] = await ethers.getSigners();

    await (await energyTrading.connect(seedProducer).registerUser(1)).wait(); // Producer
    await (
      await energyTrading.connect(seedProducer).createEnergyOffer(4500, ethers.parseEther("0.0058"))
    ).wait(); // 4.5 kWh @ ~₹5.80/kWh equivalent

    await (await energyTrading.connect(seedProducer2).registerUser(1)).wait(); // Producer
    await (
      await energyTrading.connect(seedProducer2).createEnergyOffer(7200, ethers.parseEther("0.0062"))
    ).wait(); // 7.2 kWh

    console.log("Seeded 2 demo offers from local test accounts.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
