import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  gasReporter: {
    currency: 'USD',
    L1: "ethereum",
    enabled: true,
  }
};

export default config;
