import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../utils/formatters';

export default function WalletButton() {
  const { isConnected, isConnecting, address, btcBalance, usdtBalance, connect, disconnect } = useWallet();

  if (isConnecting) {
    return (
      <button className="btn btn-primary" disabled style={{ opacity: 0.7 }}>
        <span className="spinner">⟳</span> Connecting...
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-balances">
            <span className="wallet-bal-btc">{btcBalance.toFixed(4)} BTC</span>
            <span className="wallet-bal-sep">|</span>
            <span className="wallet-bal-usdt">{usdtBalance.toLocaleString()} USDT</span>
          </div>
          <button className="wallet-address-btn" onClick={disconnect} title="Click to disconnect">
            <span className="wallet-dot"></span>
            {formatAddress(address)}
          </button>
        </div>
        <style>{`
          .wallet-connected {
            display: flex;
            align-items: center;
          }
          .wallet-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--color-bg-input);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: 0.25rem;
          }
          .wallet-balances {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 0.75rem;
            font-size: var(--font-size-sm);
            font-weight: 500;
          }
          .wallet-bal-btc { color: var(--color-accent); }
          .wallet-bal-usdt { color: var(--color-success); }
          .wallet-bal-sep { color: var(--color-text-muted); }
          .wallet-address-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 0.75rem;
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            font-weight: 500;
            font-family: monospace;
            transition: all var(--transition-fast);
            cursor: pointer;
          }
          .wallet-address-btn:hover {
            border-color: var(--color-danger);
            color: var(--color-danger);
          }
          .wallet-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--color-success);
            animation: pulse 2s ease-in-out infinite;
          }
          @media (max-width: 768px) {
            .wallet-balances { display: none; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <button className="btn btn-primary" onClick={connect}>
      <span>🔗</span> Connect Wallet
    </button>
  );
}
