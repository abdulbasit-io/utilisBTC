# HodlLend — HODL Your Bitcoin, Unlock Its Value

> **BTC-Collateralized Lending on Bitcoin Layer 1 — Powered by OP_NET**

HodlLend is a trustless peer-to-peer lending protocol built on Bitcoin L1 using OP_NET. Lock your BTC as collateral to borrow USDT, or lend your surplus USDT to earn interest — all without intermediaries.

## 🔥 Features

### For Borrowers
- **Lock BTC as collateral** — keep your Bitcoin position while accessing liquidity
- **Borrow USDT** — get stablecoins at market rates with flexible durations (7–365 days)
- **Repay & unlock** — pay back principal + interest to retrieve your Bitcoin
- **Real-time calculations** — see collateral ratio, interest, and total repayment instantly

### For Lenders
- **Browse loan marketplace** — find BTC-backed lending opportunities
- **Earn interest** — supply USDT and earn returns backed by Bitcoin collateral
- **Liquidation protection** — if borrowers default, claim their BTC collateral
- **Track investments** — monitor active loans, expected returns, and time remaining

### Platform
- 150% minimum collateralization ratio
- 2% platform fee on interest earned
- Simple interest calculation  
- OPWallet integration
- Dark mode with premium Bitcoin-native design

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Vanilla CSS (custom design system)
- **State:** React Context + localStorage
- **Wallet:** OPWallet browser extension
- **Network:** OP_NET Bitcoin L1 (testnet)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- [OPWallet](https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb) browser extension
- Test BTC from [faucet.opnet.org](https://faucet.opnet.org)

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 How It Works

1. **Connect** your OPWallet
2. **Choose your role:**
   - 🏦 **Borrower** — Lock BTC → Borrow USDT → Repay to unlock
   - 💰 **Lender** — Browse requests → Fund loans → Earn interest
3. **Trustless settlement** — all contract logic settles on Bitcoin L1

## 📁 Project Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Routes & layout
├── index.css                   # Design system
├── components/
│   ├── Navbar.jsx              # Navigation + wallet
│   ├── Hero.jsx                # Landing hero
│   ├── HowItWorks.jsx          # Feature explainer
│   ├── Stats.jsx               # Platform statistics
│   ├── Footer.jsx              # Footer with links
│   ├── WalletButton.jsx        # OPWallet connect
│   ├── LoanCard.jsx            # Loan display card
│   ├── CreateLoanModal.jsx     # Borrower: create loan
│   ├── LendModal.jsx           # Lender: fund loan
│   ├── BorrowerDashboard.jsx   # Borrower view
│   └── LenderDashboard.jsx     # Lender view
├── context/
│   └── WalletContext.jsx       # Wallet state
└── utils/
    ├── constants.js            # Config & params
    ├── formatters.js           # Number/date formatting
    └── lendingEngine.js        # Lending simulation
```

## 🔗 Links

- [OP_NET](https://opnet.org)
- [Developer Docs](https://docs.opnet.org)
- [OPWallet](https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb)
- [Discord](https://discord.com/invite/opnet)
- [Telegram](https://t.me/opnetbtc)

## 📄 License

MIT

---

**#opnetvibecode** · Built with ❤️ on Bitcoin L1 · Powered by OP_NET
