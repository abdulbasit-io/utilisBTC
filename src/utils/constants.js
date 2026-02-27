// ═══════════════════════════════════════════════════════════
// HodlLend Constants & Configuration
// ═══════════════════════════════════════════════════════════

// Network config
export const NETWORK = 'testnet';
export const RPC_URL = 'https://testnet.opnet.org';

// Platform parameters
export const MIN_COLLATERAL_RATIO = 1.5;       // 150% minimum collateralization
export const PLATFORM_FEE_RATE = 0.02;          // 2% of interest earned
export const DEFAULT_INTEREST_RATE = 0.08;      // 8% annual interest
export const MIN_LOAN_DURATION_DAYS = 7;
export const MAX_LOAN_DURATION_DAYS = 365;
export const MIN_BTC_COLLATERAL = 0.001;        // Minimum BTC to lock
export const BTC_DECIMALS = 8;
export const USDT_DECIMALS = 8;

// Simulated BTC price (mock oracle)
export const MOCK_BTC_PRICE_USD = 97500;

// Loan statuses
export const LOAN_STATUS = {
  PENDING: 'pending',       // Waiting for a lender
  FUNDED: 'funded',         // Lender has funded, loan active
  ACTIVE: 'active',         // Loan is currently active
  REPAID: 'repaid',         // Borrower repaid on time
  LIQUIDATED: 'liquidated', // Collateral seized by lender
  EXPIRED: 'expired',       // Loan expired without repayment
};

// Status display config
export const STATUS_CONFIG = {
  [LOAN_STATUS.PENDING]: { label: 'Pending', badge: 'badge-warning', icon: '⏳' },
  [LOAN_STATUS.FUNDED]: { label: 'Funded', badge: 'badge-info', icon: '💰' },
  [LOAN_STATUS.ACTIVE]: { label: 'Active', badge: 'badge-success', icon: '✅' },
  [LOAN_STATUS.REPAID]: { label: 'Repaid', badge: 'badge-success', icon: '🎉' },
  [LOAN_STATUS.LIQUIDATED]: { label: 'Liquidated', badge: 'badge-danger', icon: '⚠️' },
  [LOAN_STATUS.EXPIRED]: { label: 'Expired', badge: 'badge-danger', icon: '❌' },
};

// Mock contract addresses (OP_NET testnet format)
export const CONTRACTS = {
  LENDING_POOL: '0x7a9f3c1e8d2b4a6f0c5e1d7a9b0c2e5f8a3d6b1c4e7f0a2d5b8c1e4f7a0b3d',
  USDT_TOKEN: '0x4b2e8f1a6c3d5e9f0a7b4c1d8e5f2a6b3c0d7e4f1a8b5c2d9e6f3a0b7c4d1e',
};

// Links
export const LINKS = {
  OPNET: 'https://opnet.org',
  DOCS: 'https://docs.opnet.org',
  GITHUB: 'https://github.com/abdulbasit-io/HodlLend',
  OPWALLET: 'https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb',
  DISCORD: 'https://discord.com/invite/opnet',
  TELEGRAM: 'https://t.me/opnetbtc',
  TWITTER: 'https://x.com/opnetbtc',
  FAUCET: 'https://faucet.opnet.org',
};
