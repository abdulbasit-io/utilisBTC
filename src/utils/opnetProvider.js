// ═══════════════════════════════════════════════════════════
// OP_NET Provider Service
// Connects to OP_NET RPC and provides contract interaction
// ═══════════════════════════════════════════════════════════

import { JSONRpcProvider } from 'opnet';

// RPC endpoints by network
const RPC_ENDPOINTS = {
  regtest: 'https://regtest.opnet.org',
  testnet: 'https://testnet.opnet.org',
  mainnet: 'https://mainnet.opnet.org',
};

let providerInstance = null;
let currentNetwork = 'testnet';

/**
 * Get or create the JSONRpcProvider singleton
 */
export function getProvider(network = 'regtest') {
  if (!providerInstance || currentNetwork !== network) {
    const url = RPC_ENDPOINTS[network] || RPC_ENDPOINTS.regtest;
    try {
      providerInstance = new JSONRpcProvider(url);
      currentNetwork = network;
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
    const balance = await provider.getBalance(address);
    return balance;
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
    try {
      providerInstance.close();
    } catch (err) {
      // ignore
    }
    providerInstance = null;
  }
}

export default {
  getProvider,
  getBlockNumber,
  getBalance,
  closeProvider,
};
