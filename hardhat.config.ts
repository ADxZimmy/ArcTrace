import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const rpcUrl = process.env.CANTEEN_RPC_URL || process.env.ARC_RPC_URL || "";
const privateKey = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arcTestnet: {
      url: rpcUrl,
      chainId: Number(process.env.ARC_CHAIN_ID || 5042002),
      accounts: privateKey ? [privateKey] : [],
    },
  },
  paths: {
    tests: "./test/contracts",
  },
};

export default config;
