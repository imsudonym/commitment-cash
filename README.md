# Catalyst: Solo Commitment Smart Contract for Bitcoin Cash

Catalyst is a Node.js project implementing a Bitcoin Cash (BCH) smart contract using [CashScript](https://cashscript.org/). It enables a trust-minimized, time-locked commitment between an owner and an arbiter, supporting conditional fund release, cancellation, and sweep operations.

## Features
- **SoloCommitment Contract**: Written in CashScript, compiled to Bitcoin Cash bytecode.
- **Conditional Release**: Funds can be released to the owner by the arbiter before expiration.
- **Cancellation**: Owner or arbiter can cancel the contract, refunding 70% to the owner and 30% to the arbiter.
- **Sweep**: After expiration, the arbiter can sweep remaining funds.
- **Automated CLI**: Interact with the contract via command-line actions.

## Project Structure
```
├── src/
│   ├── contracts/
│   │   ├── solo-commitment.cash           # CashScript contract source
│   │   └── solo-commitment-artifact.json  # Compiled contract artifact
│   ├── js/
│   │   ├── constants.js                   # Network and fee constants
│   │   ├── solo-commitment.js             # Commitment class (contract logic)
│   │   └── utils.js                       # Utility functions
│   └── index.js                           # CLI entry point
├── .env                                   # Environment variables (WIFs, pubkeys)
├── package.json                           # Dependencies
```

## Installation
1. **Clone the repository**
   ```sh
   git clone <repo-url>
   cd catalyst
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Configure environment**
   - Copy `env-example` to `.env` and fill in your BCH WIFs and public keys.

## Usage
Run the CLI with Node.js:
```sh
node src/index.js <action> [expiration_block]
```
- `<action>`: `balance` | `release` | `sweep` | `cancel`
- `[expiration_block]`: (optional) Block height for contract expiration

**Examples:**
- Check contract balance:
  ```sh
  node src/index.js balance
  ```
- Release funds:
  ```sh
  node src/index.js release
  ```
- Sweep unclaimed funds:
  ```sh
  node src/index.js sweep
  ```
- Cancel commitment:
  ```sh
  node src/index.js cancel
  ```

## Requirements
- Node.js v16+
- BCH testnet/mainnet funds for contract interaction

## License
MIT

---
**Note:** This project is for educational and experimental purposes. Use at your own risk.
