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
 * Send a contract interaction via OPWallet.
 * Uses encodeCalldata (proven working) + tries multiple OPWallet param formats.
 */
async function sendViaOPWallet(methodName, args, senderAddress) {
  if (!window.opnet) {
    throw new Error('OPWallet not available');
  }

  // Step 1: Encode calldata using the SDK (proven working in Node.js tests)
  const c = getContractInstance(senderAddress);
  if (!c) throw new Error('Contract instance not available');

  let calldata;
  try {
    calldata = c.encodeCalldata(methodName, args);
  } catch (e) {
    throw new Error(`Failed to encode ${methodName}: ${e.message}`);
  }

  if (!calldata) {
    throw new Error('encodeCalldata returned null');
  }

  // Convert to hex string
  let calldataHex;
  if (typeof calldata === 'string') {
    calldataHex = calldata;
  } else if (calldata instanceof Uint8Array || Buffer.isBuffer(calldata)) {
    calldataHex = Buffer.from(calldata).toString('hex');
  } else if (calldata.toString) {
    calldataHex = calldata.toString('hex');
  } else {
    throw new Error('Unknown calldata format');
  }

  console.log(`[utilisBTC] ⛓️ ${methodName} → OPWallet`);
  console.log(`[utilisBTC]   Contract: ${CONTRACTS.UTILISBTC}`);
  console.log(`[utilisBTC]   Calldata: ${calldataHex.substring(0, 40)}… (${calldataHex.length / 2} bytes)`);

  const errors = [];

  // Attempt 1: signAndBroadcastInteraction
  if (typeof window.opnet.signAndBroadcastInteraction === 'function') {
    try {
      console.log('[utilisBTC]   Trying signAndBroadcastInteraction...');
      const result = await window.opnet.signAndBroadcastInteraction({
        contractAddress: CONTRACTS.UTILISBTC,
        calldata: calldataHex,
        from: senderAddress,
      });
      console.log('[utilisBTC]   ✅ Success:', result);
      return result?.txId || result?.transactionId || result || 'tx_submitted';
    } catch (e) {
      errors.push(`signAndBroadcastInteraction: ${e.message}`);
      console.warn('[utilisBTC]   ❌', e.message);
    }
  }

  // Attempt 2: signInteraction with to + calldata
  if (typeof window.opnet.signInteraction === 'function') {
    try {
      console.log('[utilisBTC]   Trying signInteraction({to, calldata})...');
      const result = await window.opnet.signInteraction({
        to: CONTRACTS.UTILISBTC,
        calldata: calldataHex,
        from: senderAddress,
      });
      console.log('[utilisBTC]   ✅ signInteraction result:', result);

      // If sign-only, push the tx
      if (result && typeof window.opnet.pushTx === 'function') {
        const raw = result.rawTransaction || result.hex || result.psbtHex;
        if (raw) {
          const pushed = await window.opnet.pushTx(raw);
          return pushed?.txId || pushed || 'tx_pushed';
        }
      }
      return result?.txId || result?.transactionId || result || 'tx_submitted';
    } catch (e) {
      errors.push(`signInteraction(to,calldata): ${e.message}`);
      console.warn('[utilisBTC]   ❌', e.message);
    }
  }

  // Attempt 3: signInteraction with data field
  if (typeof window.opnet.signInteraction === 'function') {
    try {
      console.log('[utilisBTC]   Trying signInteraction({to, data})...');
      const result = await window.opnet.signInteraction({
        to: CONTRACTS.UTILISBTC,
        data: calldataHex,
        from: senderAddress,
      });
      console.log('[utilisBTC]   ✅ signInteraction (data) result:', result);
      return result?.txId || result?.transactionId || result || 'tx_submitted';
    } catch (e) {
      errors.push(`signInteraction(to,data): ${e.message}`);
      console.warn('[utilisBTC]   ❌', e.message);
    }
  }

  // Attempt 4: signInteraction with interactionParameters wrapper
  if (typeof window.opnet.signInteraction === 'function') {
    try {
      console.log('[utilisBTC]   Trying signInteraction({interactionParameters})...');
      const result = await window.opnet.signInteraction({
        interactionParameters: {
          contractAddress: CONTRACTS.UTILISBTC,
          calldata: calldataHex,
        },
        from: senderAddress,
      });
      console.log('[utilisBTC]   ✅ signInteraction (wrapped) result:', result);
      return result?.txId || result?.transactionId || result || 'tx_submitted';
    } catch (e) {
      errors.push(`signInteraction(wrapped): ${e.message}`);
      console.warn('[utilisBTC]   ❌', e.message);
    }
  }

  // All wallet attempts failed — throw with details
  const errMsg = `On-chain signing failed:\n${errors.join('\n')}`;
  console.error('[utilisBTC]', errMsg);
  throw new Error(errMsg);
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
