# TSLA Exchange

Synthetic TSLA on-ramp.

Contract deployed to [0x3df4539a20F11D8D737f17290DA726ff4B049aD5](https://etherscan.io/address/0x3df4539a20F11D8D737f17290DA726ff4B049aD5).

## Development

Install dependencies via Yarn:

```bash
yarn install
```

Compile contracts via Hardhat:

```bash
yarn run hardhat compile
```

### Networks

By default, Hardhat uses the Hardhat Network in-process.

To use an external network via URL, set the `URL` environment variable and append commands with `--network generic`:

```bash
URL="[NODE_URL]" yarn run hardhat test --network generic
```

### Testing

To test the contracts via Hardhat, specify a URL from which to fork the mainnet by setting the `FORK_URL` environment variable:

```bash
FORK_URL="[NODE_URL]" yarn run hardhat test
```

Activate gas usage reporting by setting the `REPORT_GAS` environment variable to `"true"`:

```bash
REPORT_GAS=true yarn run hardhat test
```

Generate a code coverage report using `solidity-coverage`:

```bash
yarn run hardhat coverage
```

### Documentation

A documentation site is output on contract compilation to the `docgen` directory.  It can also be generated manually:

```bash
yarn run hardhat docgen
```

### Deployment

The contract can be deployed using the `deploy` task:

```bash
yarn run hardhat deploy
```
