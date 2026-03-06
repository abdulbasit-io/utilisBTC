// ═══════════════════════════════════════════════════════════
// OP_NET Provider Service
// ═══════════════════════════════════════════════════════════

import { JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';

const RPC_URL = 'https://testnet.opnet.org';

let providerInstance = null;

/**
 * Get or create the JSONRpcProvider singleton.
 * Uses networks.testnet — networks.opnetTestnet does NOT exist in @btc-vision/bitcoin.
 */
export function getProvider() {
  if (!providerInstance) {
    try {
      providerInstance = new JSONRpcProvider(RPC_URL, networks.testnet);
    } catch (err) {
      console.warn('Failed to create OP_NET provider:', err);
      providerInstance = null;
    }
  }
  return providerInstance;
}

/**
 * Get the current block number
 */
export async function getBlockNumber() {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.getBlockNumber();
  } catch (err) {
    console.warn('Failed to get block number:', err);
    return null;
  }
}

/**
 * Get BTC balance for an address (in satoshis)
 */
export async function getBalance(address) {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.getBalance(address);
  } catch (err) {
    console.warn('Failed to get balance:', err);
    return null;
  }
}

/**
 * Close provider connection
 */
export function closeProvider() {
  if (providerInstance) {
    try { providerInstance.close(); } catch { /* ignore */ }
    providerInstance = null;
  }
}

export default { getProvider, getBlockNumber, getBalance, closeProvider };
