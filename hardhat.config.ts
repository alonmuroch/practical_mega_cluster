import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-viem";
import "hardhat-dependency-compiler";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: '0.8.4',
      },
      {
        version: '0.8.18',
      },
      {
        version: '0.8.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  gasReporter: {
    currency: 'USD',
    L1: "ethereum",
    enabled: true,
    outputFile: "./gas_report.md",
    forceTerminalOutput: true,
    forceTerminalOutputFormat: "terminal"
  },
  networks: {
    hardhat:{
      allowUnlimitedContractSize: true,
    }
  },
  dependencyCompiler: {
    paths: [
      'ssv-network/contracts/token/SSVToken.sol',
      'ssv-network/contracts/modules/SSVOperators.sol',
      'ssv-network/contracts/modules/SSVClusters.sol',
      'ssv-network/contracts/modules/SSVDAO.sol',
      'ssv-network/contracts/modules/SSVViews.sol',
      'ssv-network/contracts/SSVNetwork.sol',
      'ssv-network/contracts/SSVNetworkViews.sol',
    ],
  }
};

export default config;
