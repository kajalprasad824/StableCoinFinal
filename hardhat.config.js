require('@openzeppelin/hardhat-upgrades');
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27", // Replace with your desired Solidity version
    settings: {
      optimizer: {
        enabled: true, // Enable optimization
        runs: 200,     // Set the number of optimization runs
      },
    },
  },

  networks: {
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true
  },
  
};

//0x68b068df12cece45da2c8856bb13d365868a2215 
