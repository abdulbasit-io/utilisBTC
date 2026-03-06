// ═══════════════════════════════════════════════════════════
// utilisBTC On-Chain Contract Service
// ═══════════════════════════════════════════════════════════
// Proper OPNet SDK flow: getContract → simulate → sendTransaction
// The TransactionFactory auto-detects window.opnet.web3 and routes
// signing to OPWallet — no manual wallet calls needed.

import { getContract } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import {
  CONTRACTS,
  CONTRACT_STATUS_MAP,
  MOCK_BTC_PRICE_USD,
  PLATFORM_FEE_RATE,
} from './constants';
import utilisBTCABI from '../../contract/abis/utilisBTC.abi.json';
import { getProvider } from './opnetProvider';

// @btc-vision/bitcoin v6.5.6 only exports 'regtest' and 'testnet'.
// networks.testnet has bech32Opnet:'opt' matching OPNet testnet (opt1...) addresses.
function getNetworkConfig() {
  return networks.testnet;
}

// ── Contract Instance ────────────────────────────────────

function getContractInstance() {
  const prov = getProvider();
  if (!prov || !CONTRACTS.UTILISBTC) return null;

  try {
    // No sender needed for reads; for writes OPWallet provides the sender
    return getContract(
      CONTRACTS.UTILISBTC,
      utilisBTCABI,
      prov,
      getNetworkConfig(),
    );
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
 * Enrich raw on-chain loan data with calculated fields the UI needs.
 * On-chain: collateral/amount in sats, duration in blocks, timestamps are block numbers.
 */
function enrichOnChainLoan(loanId, p) {
  const durationBlocks = Number(p.duration || 0n);
  const durationDays = durationBlocks > 0 ? Math.round(durationBlocks / 144) : 0;

  const btcCollateral = Number(p.collateral || 0n) / 1e8;
  const usdtAmount = Number(p.amount || 0n) / 1e8;
  const interestBps = Number(p.interestBps || 0n);
  const interestRate = interestBps / 10000; // decimal e.g. 0.08 for 8%

  // Simple interest: principal * rate * (days/365)
  const interest = usdtAmount * interestRate * (durationDays / 365);
  const platformFee = interest * PLATFORM_FEE_RATE;
  const totalRepayment = Number(p.repayment || 0n) / 1e8 || (usdtAmount + interest + platformFee);

  const collateralRatio = usdtAmount > 0
    ? (btcCollateral * MOCK_BTC_PRICE_USD) / usdtAmount
    : 0;

  // createdAt / fundedAt are stored as block numbers — convert to string for display
  const createdAtBlock = Number(p.createdAt || 0n);
  const fundedAtBlock = Number(p.fundedAt || 0n);

  return {
    id: loanId,
    borrower: p.borrower?.toString() || '',
    lender: p.lender?.toString() || '',
    btcCollateral,
    usdtAmount,
    interestRate,
    interestBps,
    durationDays,
    interest,
    platformFee,
    totalRepayment,
    collateralRatio,
    status: CONTRACT_STATUS_MAP[Number(p.status || 0n)] || 'pending',
    createdAt: createdAtBlock > 0 ? `block #${createdAtBlock}` : null,
    fundedAt: fundedAtBlock > 0 ? `block #${fundedAtBlock}` : null,
    expiresAt: null, // cannot derive timestamp from block number without oracle
    btcPriceAtCreation: MOCK_BTC_PRICE_USD,
    onChain: true,
  };
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

    return enrichOnChainLoan(loanId, result.properties);
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
//
// Flow:
//   1. Simulate via SDK contract instance (validates tx, gets calldata + gas)
//   2. Call simulation.sendTransaction({ signer: null, mldsaSigner: null, ... })
//   3. TransactionFactory detects window.opnet.web3 and routes to OPWallet
//   4. OPWallet prompts user to sign + broadcasts the transaction
//
// NEVER construct PSBTs manually. NEVER call window.opnet directly.

async function executeOnChain(methodName, args, senderAddress) {
  if (typeof window === 'undefined' || !window.opnet?.web3) {
    throw new Error('OPWallet not detected. Please install OPWallet to submit transactions.');
  }

  const c = getContractInstance();
  if (!c) throw new Error('Contract instance not available — check contract address in .env');

  console.log(`[utilisBTC] Simulating ${methodName}...`);

  // Step 1: Simulate — validates transaction and retrieves gas estimate + calldata
  let simulation;
  try {
    simulation = await c[methodName](...args);
  } catch (e) {
    throw new Error(`Simulation failed for ${methodName}: ${e.message}`);
  }

  if (simulation.revert) {
    throw new Error(`Transaction would revert: ${simulation.revert}`);
  }

  console.log(`[utilisBTC] Simulation OK. Sending via OPWallet...`);

  // Step 2: Send — TransactionFactory auto-detects OPWallet via window.opnet.web3
  // signer: null / mldsaSigner: null tells the factory to use the browser wallet
  const receipt = await simulation.sendTransaction({
    signer: null,
    mldsaSigner: null,
    refundTo: senderAddress,
    maximumAllowedSatToSpend: 10_000_000n, // 0.1 BTC max spend cap
    network: getNetworkConfig(),
  });

  console.log(`[utilisBTC] Transaction sent:`, receipt.transactionId);
  return receipt.transactionId;
}

// ── Public Write Methods ────────────────────────────────

/**
 * Create a loan on-chain.
 * Includes the BTC collateral as an extra output in the transaction so the
 * contract's BTC-transfer verification check passes.
 */
export async function createLoanOnChain(senderAddress, collateralSats, loanAmountSats, durationDays, interestRateBps) {
  if (typeof window === 'undefined' || !window.opnet?.web3) {
    throw new Error('OPWallet not detected. Please install OPWallet to submit transactions.');
  }

  const c = getContractInstance();
  if (!c) throw new Error('Contract instance not available — check contract address in .env');

  const collateralBigInt = BigInt(collateralSats);
  const contractAddr = CONTRACTS.UTILISBTC;

  // Tell the simulator about the collateral output so the contract's
  // BTC-verification check sees it during simulation.
  // Index 0 is reserved by OPNet; collateral output is at index 1.
  c.setTransactionDetails({
    inputs: [],
    outputs: [
      {
        value: collateralBigInt,
        index: 1,
        flags: 1, // hasTo
        to: contractAddr,
      },
    ],
  });

  console.log(`[utilisBTC] Simulating createLoan with ${collateralSats} sats collateral...`);

  let simulation;
  try {
    simulation = await c.createLoan(
      collateralBigInt,
      BigInt(loanAmountSats),
      BigInt(durationDays),
      BigInt(interestRateBps),
    );
  } catch (e) {
    throw new Error(`Simulation failed for createLoan: ${e.message}`);
  }

  if (simulation.revert) {
    throw new Error(`Transaction would revert: ${simulation.revert}`);
  }

  console.log(`[utilisBTC] Simulation OK. Sending via OPWallet...`);

  // Include the collateral BTC as a real output in the Bitcoin transaction.
  const receipt = await simulation.sendTransaction({
    signer: null,
    mldsaSigner: null,
    refundTo: senderAddress,
    // Cap must cover collateral + fees; add 0.005 BTC buffer for fees
    maximumAllowedSatToSpend: collateralBigInt + 500_000n,
    network: getNetworkConfig(),
    extraOutputs: [
      { address: contractAddr, value: collateralBigInt },
    ],
  });

  console.log(`[utilisBTC] Transaction sent:`, receipt.transactionId);
  return receipt.transactionId;
}

/**
 * Fund a loan on-chain
 */
export async function fundLoanOnChain(senderAddress, loanId) {
  return executeOnChain('fundLoan', [BigInt(loanId)], senderAddress);
}

/**
 * Repay a loan on-chain
 */
export async function repayLoanOnChain(senderAddress, loanId) {
  return executeOnChain('repayLoan', [BigInt(loanId)], senderAddress);
}

/**
 * Liquidate an expired loan on-chain
 */
export async function liquidateLoanOnChain(senderAddress, loanId) {
  return executeOnChain('liquidateLoan', [BigInt(loanId)], senderAddress);
}

/**
 * Cancel a pending loan on-chain
 */
export async function cancelLoanOnChain(senderAddress, loanId) {
  return executeOnChain('cancelLoan', [BigInt(loanId)], senderAddress);
}

// ── Helpers ─────────────────────────────────────────────

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
