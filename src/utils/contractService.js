// ═══════════════════════════════════════════════════════════
// HodlLend On-Chain Contract Service
// ═══════════════════════════════════════════════════════════
// Hybrid approach: tries on-chain calls first, falls back to localStorage.
// This ensures the demo always works while showcasing real chain interaction.

import { getContract, JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { CONTRACTS, NETWORK, RPC_URL, CONTRACT_STATUS_MAP } from './constants';
import HodlLendABI from '../../contract/abis/HodlLend.abi.json';

// ── Provider & Contract Instance ────────────────────────

let provider = null;
let contract = null;

function getNetworkConfig() {
  return NETWORK === 'testnet' ? networks.testnet : networks.regtest;
}

function getProviderInstance() {
  if (!provider) {
    try {
      provider = new JSONRpcProvider(RPC_URL, getNetworkConfig());
    } catch (e) {
      console.warn('Failed to create provider:', e);
    }
  }
  return provider;
}

function getContractInstance(senderAddress) {
  const prov = getProviderInstance();
  if (!prov || !CONTRACTS.HODLLEND) return null;

  try {
    contract = getContract(
      CONTRACTS.HODLLEND,
      HodlLendABI,
      prov,
      getNetworkConfig(),
      senderAddress || undefined
    );
    return contract;
  } catch (e) {
    console.warn('Failed to create contract instance:', e);
    return null;
  }
}

// ── Read Functions (free, no gas) ───────────────────────

/**
 * Get total loan count from on-chain
 */
export async function getOnChainLoanCount() {
  try {
    const c = getContractInstance();
    if (!c) return null;

    const result = await c.getLoanCount();
    if (result?.properties?.count !== undefined) {
      return Number(result.properties.count);
    }
    return null;
  } catch (e) {
    console.warn('getLoanCount on-chain failed:', e);
    return null;
  }
}

/**
 * Get a single loan by ID from on-chain
 */
export async function getOnChainLoan(loanId) {
  try {
    const c = getContractInstance();
    if (!c) return null;

    const result = await c.getLoan(BigInt(loanId));
    if (!result?.properties) return null;

    const p = result.properties;
    return {
      id: loanId,
      borrower: p.borrower?.toString() || '',
      lender: p.lender?.toString() || '',
      btcCollateral: Number(p.collateral || 0n) / 1e8,
      usdtAmount: Number(p.amount || 0n) / 1e8,
      interestRate: Number(p.interestBps || 0n) / 10000,
      durationDays: Number(p.duration || 0n),
      status: CONTRACT_STATUS_MAP[Number(p.status || 0n)] || 'pending',
      createdAt: Number(p.createdAt || 0n) > 0
        ? new Date(Number(p.createdAt) * 1000).toISOString()
        : null,
      fundedAt: Number(p.fundedAt || 0n) > 0
        ? new Date(Number(p.fundedAt) * 1000).toISOString()
        : null,
      totalRepayment: Number(p.repayment || 0n) / 1e8,
      onChain: true,
    };
  } catch (e) {
    console.warn(`getLoan(${loanId}) on-chain failed:`, e);
    return null;
  }
}

/**
 * Get all loans from on-chain
 */
export async function getAllOnChainLoans() {
  try {
    const count = await getOnChainLoanCount();
    if (count === null || count === 0) return [];

    const loans = [];
    for (let i = 0; i < count; i++) {
      const loan = await getOnChainLoan(i);
      if (loan) loans.push(loan);
    }
    return loans;
  } catch (e) {
    console.warn('getAllOnChainLoans failed:', e);
    return [];
  }
}

// ── Write Functions (via OPWallet) ──────────────────────

/**
 * Build calldata for a contract method.
 * This is sent to OPWallet for signing.
 */
function buildCalldata(methodName, args, senderAddress) {
  try {
    const c = getContractInstance(senderAddress);
    if (!c) return null;
    return c.encodeCalldata(methodName, args);
  } catch (e) {
    console.warn(`encodeCalldata(${methodName}) failed:`, e);
    return null;
  }
}

/**
 * Send a contract interaction via OPWallet
 * Returns the tx hash or null
 */
async function sendViaOPWallet(methodName, args, senderAddress) {
  if (!window.opnet) {
    throw new Error('OPWallet not available');
  }

  const calldata = buildCalldata(methodName, args, senderAddress);
  if (!calldata) {
    throw new Error('Failed to encode calldata');
  }

  try {
    // OPWallet's signInteraction API
    const result = await window.opnet.signInteraction({
      to: CONTRACTS.HODLLEND,
      calldata: calldata.toString('hex'),
    });

    if (result?.txId) {
      return result.txId;
    }

    // Alternative: some OPWallet versions use different response format
    if (result?.transactionId) {
      return result.transactionId;
    }

    return result || 'tx_submitted';
  } catch (e) {
    console.error(`OPWallet interaction ${methodName} failed:`, e);
    throw e;
  }
}

// ── Public Write Methods ────────────────────────────────

/**
 * Create a loan on-chain
 */
export async function createLoanOnChain(senderAddress, collateralSats, loanAmountSats, durationDays, interestRateBps) {
  return sendViaOPWallet('createLoan', [
    BigInt(collateralSats),
    BigInt(loanAmountSats),
    BigInt(durationDays),
    BigInt(interestRateBps),
  ], senderAddress);
}

/**
 * Fund a loan on-chain
 */
export async function fundLoanOnChain(senderAddress, loanId) {
  return sendViaOPWallet('fundLoan', [
    BigInt(loanId),
  ], senderAddress);
}

/**
 * Repay a loan on-chain
 */
export async function repayLoanOnChain(senderAddress, loanId) {
  return sendViaOPWallet('repayLoan', [
    BigInt(loanId),
  ], senderAddress);
}

/**
 * Liquidate a loan on-chain
 */
export async function liquidateLoanOnChain(senderAddress, loanId) {
  return sendViaOPWallet('liquidateLoan', [
    BigInt(loanId),
  ], senderAddress);
}

/**
 * Cancel a loan on-chain
 */
export async function cancelLoanOnChain(senderAddress, loanId) {
  return sendViaOPWallet('cancelLoan', [
    BigInt(loanId),
  ], senderAddress);
}

// ── Availability Check ──────────────────────────────────

/**
 * Check if on-chain contract is reachable
 */
export async function isContractAvailable() {
  try {
    const count = await getOnChainLoanCount();
    return count !== null;
  } catch {
    return false;
  }
}

/**
 * Get contract address
 */
export function getContractAddress() {
  return CONTRACTS.HODLLEND || null;
}
