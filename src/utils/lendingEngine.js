// ═══════════════════════════════════════════════════════════
// HodlLend Lending Engine (Simulation)
// ═══════════════════════════════════════════════════════════
// This engine simulates on-chain lending logic using localStorage.
// Architecture is designed to plug into a real OP_NET smart contract.

import {
  LOAN_STATUS,
  MIN_COLLATERAL_RATIO,
  PLATFORM_FEE_RATE,
  MOCK_BTC_PRICE_USD,
} from './constants';
import { calcInterest, generateId, generateMockTxHash } from './formatters';

const STORAGE_KEY = 'hodllend_loans';
const PLATFORM_STATS_KEY = 'hodllend_stats';

// ── Loan Storage ────────────────────────────────────────

function getLoans() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLoans(loans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
}

function updateLoan(loanId, updates) {
  const loans = getLoans();
  const index = loans.findIndex(l => l.id === loanId);
  if (index === -1) throw new Error('Loan not found');
  loans[index] = { ...loans[index], ...updates, updatedAt: new Date().toISOString() };
  saveLoans(loans);
  return loans[index];
}

// ── Platform Stats ──────────────────────────────────────

function getStats() {
  try {
    const data = localStorage.getItem(PLATFORM_STATS_KEY);
    return data ? JSON.parse(data) : {
      totalValueLocked: 2.47,    // BTC
      totalLoansIssued: 18,
      totalInterestEarned: 1250, // USDT
      activeUsers: 42,
    };
  } catch {
    return {
      totalValueLocked: 2.47,
      totalLoansIssued: 18,
      totalInterestEarned: 1250,
      activeUsers: 42,
    };
  }
}

function saveStats(stats) {
  localStorage.setItem(PLATFORM_STATS_KEY, JSON.stringify(stats));
}

// ── Core Operations ─────────────────────────────────────

/**
 * Create a new loan request (Borrower action)
 * @param {object} params - { borrower, btcCollateral, usdtAmount, durationDays, interestRate }
 * @returns {object} The created loan
 */
export function createLoanRequest({
  borrower,
  btcCollateral,
  usdtAmount,
  durationDays,
  interestRate,
}) {
  // Validate collateralization ratio
  const collateralValueUSD = btcCollateral * MOCK_BTC_PRICE_USD;
  const ratio = collateralValueUSD / usdtAmount;

  if (ratio < MIN_COLLATERAL_RATIO) {
    throw new Error(
      `Collateral ratio ${(ratio * 100).toFixed(0)}% is below minimum ${(MIN_COLLATERAL_RATIO * 100).toFixed(0)}%`
    );
  }

  const interest = calcInterest(usdtAmount, interestRate, durationDays);
  const platformFee = interest * PLATFORM_FEE_RATE;
  const totalRepayment = usdtAmount + interest;

  const loan = {
    id: generateId(),
    borrower,
    lender: null,
    btcCollateral: parseFloat(btcCollateral),
    usdtAmount: parseFloat(usdtAmount),
    durationDays: parseInt(durationDays),
    interestRate: parseFloat(interestRate),
    interest,
    platformFee,
    totalRepayment,
    collateralRatio: ratio,
    btcPriceAtCreation: MOCK_BTC_PRICE_USD,
    status: LOAN_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    fundedAt: null,
    expiresAt: null,
    repaidAt: null,
    liquidatedAt: null,
    txHash: generateMockTxHash(),
    updatedAt: new Date().toISOString(),
  };

  const loans = getLoans();
  loans.unshift(loan);
  saveLoans(loans);

  // Update stats
  const stats = getStats();
  stats.totalValueLocked += btcCollateral;
  stats.totalLoansIssued += 1;
  saveStats(stats);

  return loan;
}

/**
 * Fund a loan (Lender action)
 * @param {string} loanId - ID of the loan to fund
 * @param {string} lender - Lender's wallet address
 * @returns {object} The updated loan
 */
export function fundLoan(loanId, lender) {
  const loans = getLoans();
  const loan = loans.find(l => l.id === loanId);

  if (!loan) throw new Error('Loan not found');
  if (loan.status !== LOAN_STATUS.PENDING) throw new Error('Loan is not available for funding');
  if (loan.borrower === lender) throw new Error('Cannot fund your own loan');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + loan.durationDays * 24 * 60 * 60 * 1000);

  return updateLoan(loanId, {
    lender,
    status: LOAN_STATUS.ACTIVE,
    fundedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    fundTxHash: generateMockTxHash(),
  });
}

/**
 * Repay a loan (Borrower action)
 * @param {string} loanId - ID of the loan to repay
 * @returns {object} The updated loan
 */
export function repayLoan(loanId) {
  const loans = getLoans();
  const loan = loans.find(l => l.id === loanId);

  if (!loan) throw new Error('Loan not found');
  if (loan.status !== LOAN_STATUS.ACTIVE) throw new Error('Loan is not active');

  const updatedLoan = updateLoan(loanId, {
    status: LOAN_STATUS.REPAID,
    repaidAt: new Date().toISOString(),
    repayTxHash: generateMockTxHash(),
  });

  // Update stats
  const stats = getStats();
  stats.totalValueLocked -= loan.btcCollateral;
  stats.totalInterestEarned += loan.interest;
  saveStats(stats);

  return updatedLoan;
}

/**
 * Liquidate an expired loan (Lender action)
 * @param {string} loanId - ID of the loan to liquidate
 * @returns {object} The updated loan
 */
export function liquidateLoan(loanId) {
  const loans = getLoans();
  const loan = loans.find(l => l.id === loanId);

  if (!loan) throw new Error('Loan not found');
  if (loan.status !== LOAN_STATUS.ACTIVE) throw new Error('Loan is not active');

  const now = new Date();
  const expiresAt = new Date(loan.expiresAt);
  if (now < expiresAt) throw new Error('Loan has not expired yet');

  const updatedLoan = updateLoan(loanId, {
    status: LOAN_STATUS.LIQUIDATED,
    liquidatedAt: now.toISOString(),
    liquidateTxHash: generateMockTxHash(),
  });

  // Update stats
  const stats = getStats();
  stats.totalValueLocked -= loan.btcCollateral;
  saveStats(stats);

  return updatedLoan;
}

/**
 * Cancel a pending loan request (Borrower action)
 * @param {string} loanId - ID of the loan to cancel
 * @returns {object} The updated loan
 */
export function cancelLoan(loanId) {
  const loans = getLoans();
  const loan = loans.find(l => l.id === loanId);

  if (!loan) throw new Error('Loan not found');
  if (loan.status !== LOAN_STATUS.PENDING) throw new Error('Only pending loans can be cancelled');

  const updatedLoan = updateLoan(loanId, {
    status: LOAN_STATUS.EXPIRED,
  });

  const stats = getStats();
  stats.totalValueLocked -= loan.btcCollateral;
  stats.totalLoansIssued -= 1;
  saveStats(stats);

  return updatedLoan;
}

// ── Query Functions ─────────────────────────────────────

/**
 * Get all loans
 */
export function getAllLoans() {
  return getLoans();
}

/**
 * Get loans for a specific borrower
 */
export function getBorrowerLoans(borrower) {
  return getLoans().filter(l => l.borrower === borrower);
}

/**
 * Get loans funded by a specific lender
 */
export function getLenderLoans(lender) {
  return getLoans().filter(l => l.lender === lender);
}

/**
 * Get available loan requests (pending loans that can be funded)
 */
export function getAvailableLoans() {
  return getLoans().filter(l => l.status === LOAN_STATUS.PENDING);
}

/**
 * Get platform statistics
 */
export function getPlatformStats() {
  return getStats();
}

/**
 * Get current BTC price (mock oracle)
 */
export function getBTCPrice() {
  return MOCK_BTC_PRICE_USD;
}

/**
 * Reset all data (for demo purposes)
 */
export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PLATFORM_STATS_KEY);
}

/**
 * Seed demo data for showcase
 */
export function seedDemoData(currentUser) {
  const existingLoans = getLoans();
  if (existingLoans.length > 0) return; // Don't overwrite existing data

  const demoLoans = [
    {
      id: generateId(),
      borrower: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
      lender: '0xf0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
      btcCollateral: 0.05,
      usdtAmount: 2500,
      durationDays: 30,
      interestRate: 0.08,
      interest: 16.44,
      platformFee: 0.33,
      totalRepayment: 2516.44,
      collateralRatio: 1.95,
      btcPriceAtCreation: MOCK_BTC_PRICE_USD,
      status: LOAN_STATUS.ACTIVE,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      fundedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      repaidAt: null,
      liquidatedAt: null,
      txHash: generateMockTxHash(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      borrower: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      lender: null,
      btcCollateral: 0.1,
      usdtAmount: 5000,
      durationDays: 60,
      interestRate: 0.1,
      interest: 82.19,
      platformFee: 1.64,
      totalRepayment: 5082.19,
      collateralRatio: 1.95,
      btcPriceAtCreation: MOCK_BTC_PRICE_USD,
      status: LOAN_STATUS.PENDING,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      fundedAt: null,
      expiresAt: null,
      repaidAt: null,
      liquidatedAt: null,
      txHash: generateMockTxHash(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      borrower: '0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      lender: null,
      btcCollateral: 0.025,
      usdtAmount: 1200,
      durationDays: 14,
      interestRate: 0.06,
      interest: 2.76,
      platformFee: 0.06,
      totalRepayment: 1202.76,
      collateralRatio: 2.03,
      btcPriceAtCreation: MOCK_BTC_PRICE_USD,
      status: LOAN_STATUS.PENDING,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      fundedAt: null,
      expiresAt: null,
      repaidAt: null,
      liquidatedAt: null,
      txHash: generateMockTxHash(),
      updatedAt: new Date().toISOString(),
    },
  ];

  saveLoans(demoLoans);
}
