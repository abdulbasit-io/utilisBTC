// ═══════════════════════════════════════════════════════════
// HodlLend Formatters & Helpers
// ═══════════════════════════════════════════════════════════

/**
 * Format a number as USD currency
 */
export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format BTC amount with up to 8 decimal places
 */
export function formatBTC(amount) {
  if (amount === 0) return '0 BTC';
  const formatted = parseFloat(amount).toFixed(8).replace(/\.?0+$/, '');
  return `${formatted} BTC`;
}

/**
 * Format USDT amount
 */
export function formatUSDT(amount) {
  return `${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
}

/**
 * Format a percentage
 */
export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a wallet address (truncate middle)
 */
export function formatAddress(address) {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a date relative to now
 */
export function formatTimeRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end - now;

  if (diffMs <= 0) return 'Expired';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;

  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m remaining`;
}

/**
 * Format a date as short string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompact(num) {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Calculate collateral ratio
 */
export function calcCollateralRatio(btcAmount, btcPrice, usdtAmount) {
  if (!usdtAmount || usdtAmount === 0) return 0;
  return (btcAmount * btcPrice) / usdtAmount;
}

/**
 * Calculate simple interest
 */
export function calcInterest(principal, annualRate, durationDays) {
  return principal * annualRate * (durationDays / 365);
}

/**
 * Generate a mock transaction hash
 */
export function generateMockTxHash() {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
