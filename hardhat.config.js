require('@nomiclabs/hardhat-waffle');
require('hardhat-dependency-compiler');
require('hardhat-docgen');
require('hardhat-gas-reporter');
require('hardhat-spdx-license-identifier');
require('solidity-coverage');

module.exports = {
  solidity: {
    version: '0.7.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      forking: {
        url: `${ process.env.FORK_URL }`,
        blockNumber: 11844175,
      },
    },

    generic: {
      // set URL for external network
      url: `${ process.env.URL }`,
      accounts: {
        mnemonic: `${ process.env.MNEMONIC }`,
      },
    },
  },

  dependencyCompiler: {
    paths: [
      '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol',
      'synthetix/contracts/interfaces/IDelegateApprovals.sol',
    ],
  },

  docgen: {
    runOnCompile: true,
    clear: true,
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
  },

  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
};
