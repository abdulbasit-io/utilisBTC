# utilisBTC

> **Bitcoin-Collateralized Lending on Layer 1 — Powered by OP_NET**

Borrow stablecoins against your BTC. Lend HODL tokens and earn yield. No banks. No bridges. Just Bitcoin.

🌐 **Live:** [utilis-btc.vercel.app](https://utilis-btc.vercel.app)  
📜 **Contract:** `opt1sqrgk652g95f5edg5tqp8vfhw2wu9zjksrgpla9m0` (OP_NET Testnet)

---

## Overview

utilisBTC is a peer-to-peer lending protocol built natively on Bitcoin L1 using OP_NET smart contracts. Users lock BTC as collateral to borrow tokens, or supply tokens to fund loans and earn interest. All core logic executes on-chain via a WASM-compiled AssemblyScript contract.

| Role | Flow |
|------|------|
| **Borrower** | Lock BTC → Borrow tokens → Repay + interest → Unlock BTC |
| **Lender** | Browse requests → Fund loans → Earn interest on repayment |

## Key Features

- 🔒 **150% overcollateralized** — every loan backed by real BTC
- ⛓️ **Bitcoin L1 native** — settles directly on Bitcoin via OP_NET
- 🤝 **Peer-to-peer** — no intermediary holds your funds
- 🔓 **Non-custodial** — smart contracts hold collateral, not a company
- 📊 **Flexible terms** — 7–365 day durations, custom interest rates
- 🔄 **Auto-refresh** — dashboards poll on-chain state every 30s
- 💰 **2% platform fee** on interest earned

## Smart Contract

Written in **AssemblyScript**, compiled to **WebAssembly**, deployed on OP_NET testnet. Extends the OP20 token standard.

| Method | Description |
|--------|-------------|
| `createLoan` | Borrower creates a loan request (collateral, amount, duration, rate) |
| `fundLoan` | Lender funds a pending loan |
| `repayLoan` | Borrower repays and unlocks collateral |
| `liquidateLoan` | Lender seizes collateral after loan expires |
| `cancelLoan` | Borrower cancels an unfunded loan |
| `getLoan` | Read loan details by ID |
| `getLoanCount` | Get total number of loans |

### On-Chain Write Flow

```
User action → SDK simulate (validates tx + gas) → simulation.sendTransaction()
  → TransactionFactory auto-detects OPWallet via window.opnet.web3
  → OPWallet prompts user to sign → Broadcasts to network
```

## Tech Stack

| Layer | Technology |
|-------|-----------:|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (custom design system) |
| Smart Contract | AssemblyScript → WASM (OP_NET) |
| Wallet | OPWallet browser extension |
| Network | OP_NET Bitcoin L1 (testnet) |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+
- [OPWallet](https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb) browser extension
- Test BTC from [faucet.opnet.org](https://faucet.opnet.org)

### Install & Run

```bash
npm install
cp .env.example .env   # Add your contract address
npm run dev
```

### Build Contract

```bash
cd contract && npm install && npm run build:lending
# Output: contract/build/utilisBTC.wasm
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_UTILISBTC_CONTRACT` | Deployed utilisBTC contract address |
| `VITE_USDT_TOKEN` | USDT token contract address (optional) |

## Architecture

```
├── contract/                    # Smart contract (AssemblyScript)
│   ├── src/lending/utilisBTC.ts # Lending contract
│   ├── build/utilisBTC.wasm     # Compiled contract
│   └── abis/utilisBTC.abi.json  # Generated ABI
├── src/                         # Frontend (React)
│   ├── components/
│   │   ├── BorrowerDashboard    # Borrow flow + on-chain reads/writes
│   │   ├── LenderDashboard      # Lend flow + marketplace
│   │   ├── CreateLoanModal      # Loan creation (on-chain or simulation)
│   │   └── LendModal            # Loan funding
│   ├── context/WalletContext    # OPWallet integration
│   └── utils/
│       ├── contractService.js   # On-chain contract interaction
│       ├── opnetProvider.js     # OP_NET RPC provider
│       ├── lendingEngine.js     # localStorage simulation + optimistic records
│       └── formatters.js        # Display formatting
```

## Known Constraints & Limitations

> These are real constraints encountered during development on the OP_NET testnet.

### Network & SDK

- **`networks.opnetTestnet`** in `@btc-vision/bitcoin` depending on version may or may not exist. Tested working with `networks.testnet` as fallback.
- **ABI format**: The `opnet` SDK's `getContract()` expects a flat array of function defs with lowercase `"type": "function"`. The generated ABI has `{functions: [...]}` wrapper and uppercase `"Function"` — runtime normalization required.
- **No USDT token contract** deployed on testnet yet. HODL balance shows 0 until a separate OP20 token is deployed and integrated.

### OPWallet Signing

- **Write flow** requires OPWallet to be **installed, unlocked, and connected**. The SDK's `TransactionFactory` auto-detects `window.opnet.web3` and routes signing to the wallet — no manual PSBT construction.
- **Simulation before send**: All write calls first simulate via RPC (`contract.method(args)`) to validate the transaction and estimate gas, then call `simulation.sendTransaction({signer: null})` to trigger the wallet popup.
- OPWallet must be unlocked (password entered) for signing prompts to appear.

### State Management

- **Optimistic local records**: After a successful on-chain write, a local record is saved to `localStorage` immediately so the dashboard reflects the change before the transaction confirms on-chain.
- **Auto-refresh**: Dashboards poll on-chain state every 30 seconds. On-chain loans are merged with local records (deduplication by ID).
- **Simulation fallback**: If OPWallet is not available or the on-chain write fails, the app falls back to `localStorage` simulation for demo purposes.

### Collateral Model

- The current contract does **not** transfer actual BTC into the contract (OP_NET's UTXO model requires `payable` interactions for real value transfer). The contract records collateral amounts in storage but does not escrow funds. This is a testnet limitation — production would require `payable` function support.

## Links

- [OP_NET](https://opnet.org) · [Developer Docs](https://docs.opnet.org) · [OPWallet](https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb)
- [Discord](https://discord.com/invite/opnet) · [Telegram](https://t.me/opnetbtc) · [Twitter](https://x.com/opnetbtc)

## License

MIT

---

**#opnetvibecode** · Built on Bitcoin L1 · Powered by OP_NET
