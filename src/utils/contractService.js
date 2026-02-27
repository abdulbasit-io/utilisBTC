// ═══════════════════════════════════════════════════════════
// utilisBTC On-Chain Contract Service
// ═══════════════════════════════════════════════════════════
// Hybrid approach: tries on-chain calls first, falls back to localStorage.
// This ensures the demo always works while showcasing real chain interaction.

import { getContract, JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { CONTRACTS, NETWORK, RPC_URL, CONTRACT_STATUS_MAP } from './constants';
import utilisBTCABI from '../../contract/abis/utilisBTC.abi.json';

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
  if (!prov || !CONTRACTS.UTILISBTC) return null;

  try {
    contract = getContract(
      CONTRACTS.UTILISBTC,
      utilisBTCABI,
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
 * Simulate a contract call and get the interaction data for signing.
 * The SDK's contract proxy returns a CallResult which contains the
 * calldata, gas estimates, and access list needed for OPWallet.
 */
async function simulateContractCall(methodName, args, senderAddress) {
  const c = getContractInstance(senderAddress);
  if (!c) throw new Error('Contract instance not available');

  // Set sender so simulation knows who is calling
  if (senderAddress) {
    try { c.setSender(senderAddress); } catch { }
  }

  // Call the method — this simulates on-chain and returns CallResult
  const result = await c[methodName](...args);

  if (result?.revert) {
    throw new Error(`Contract reverted: ${result.revert}`);
  }

  return result;
}

/**
 * Send a contract interaction via OPWallet.
 * Flow: simulate → get calldata → pass to OPWallet for signing → broadcast
 */
async function sendViaOPWallet(methodName, args, senderAddress) {
  if (!window.opnet) {
    throw new Error('OPWallet not available');
  }

  // Step 1: Simulate the call to get calldata and gas estimates
  const callResult = await simulateContractCall(methodName, args, senderAddress);

  if (!callResult?.calldata) {
    throw new Error('Simulation returned no calldata');
  }

  const interactionParams = {
    contractAddress: CONTRACTS.UTILISBTC,
    calldata: callResult.calldata.toString('hex'),
  };

  // Add gas estimates if available
  if (callResult.estimatedGas) {
    interactionParams.gasLimit = callResult.estimatedGas.toString();
  }

  try {
    // Try signAndBroadcastInteraction first (combined sign + broadcast)
    if (typeof window.opnet.signAndBroadcastInteraction === 'function') {
      const result = await window.opnet.signAndBroadcastInteraction(interactionParams);
      return result?.txId || result?.transactionId || result || 'tx_submitted';
    }
  } catch (e) {
    console.warn('signAndBroadcastInteraction failed, trying signInteraction:', e);
  }

  try {
    // Fallback: signInteraction (sign only, then push)
    const signed = await window.opnet.signInteraction(interactionParams);

    // If we got a signed tx, try to push it
    if (signed && typeof window.opnet.pushTx === 'function') {
      const rawTx = signed.rawTransaction || signed.hex || signed;
      if (typeof rawTx === 'string') {
        const pushResult = await window.opnet.pushTx(rawTx);
        return pushResult?.txId || pushResult || 'tx_submitted';
      }
    }

    return signed?.txId || signed?.transactionId || signed || 'tx_submitted';
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
  return CONTRACTS.UTILISBTC || null;
}
