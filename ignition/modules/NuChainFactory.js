const { ethers, upgrades } = require("hardhat");

async function main() {
  const gas = (await ethers.provider.getFeeData()).gasPrice;
  const nuChainFactory = await ethers.getContractFactory(
    "NuChainFactory"
  );

  console.log("Deploying NuChain Factory Smart Contract ........");

  const NuChainFactory = await upgrades.deployProxy(
    nuChainFactory,
    [
      "0x4b6428460Dc6D016f8dcD8DF2612109539DC1562", //default admin address
      "1000000000000000", // Reward rate
      "300", // Trading Fee
      "1", //Reward Period
    ],
    {
      gasPrice: gas,
      initializer: "initialize",
    }
  );

  await NuChainFactory.waitForDeployment();
  console.log(
    "NuChain Factory Smart Contract is deployed at : ",
    await NuChainFactory.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
