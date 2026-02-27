// ═══════════════════════════════════════════════════════════
// HodlLend Constants & Configuration
// ═══════════════════════════════════════════════════════════

// Network config — OP_NET testnet for deployment
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

// Simulated BTC price (mock oracle — real oracle integration requires separate contract)
export const MOCK_BTC_PRICE_USD = 97500;

// Loan statuses (matches smart contract values)
export const LOAN_STATUS = {
  PENDING: 'pending',       // 0 in contract
  ACTIVE: 'active',         // 1 in contract (funded)
  REPAID: 'repaid',         // 2 in contract
  LIQUIDATED: 'liquidated', // 3 in contract
  CANCELLED: 'cancelled',   // 4 in contract
};

// Map contract status numbers to string labels
export const CONTRACT_STATUS_MAP = {
  0: LOAN_STATUS.PENDING,
  1: LOAN_STATUS.ACTIVE,
  2: LOAN_STATUS.REPAID,
  3: LOAN_STATUS.LIQUIDATED,
  4: LOAN_STATUS.CANCELLED,
};

// Status display config
export const STATUS_CONFIG = {
  [LOAN_STATUS.PENDING]: { label: 'Pending', badge: 'badge-warning', icon: '⏳' },
  [LOAN_STATUS.ACTIVE]: { label: 'Active', badge: 'badge-success', icon: '✅' },
  [LOAN_STATUS.REPAID]: { label: 'Repaid', badge: 'badge-success', icon: '🎉' },
  [LOAN_STATUS.LIQUIDATED]: { label: 'Liquidated', badge: 'badge-danger', icon: '⚠️' },
  [LOAN_STATUS.CANCELLED]: { label: 'Cancelled', badge: 'badge-danger', icon: '❌' },
};

// Contract addresses (update after deployment via OPWallet)
export const CONTRACTS = {
  HODLLEND: '', // Set after deploying HodlLend.wasm
  USDT_TOKEN: '', // Set if a USDT token is deployed
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
