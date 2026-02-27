import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../utils/formatters';

export default function WalletButton() {
  const { 
    isConnected, isConnecting, address, btcBalance, usdtBalance, 
    connect, disconnect, walletType, refreshBalance 
  } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchWallet = async () => {
    setShowDropdown(false);
    disconnect();
    // Small delay to let state clear before reconnecting
    setTimeout(() => connect(), 300);
  };

  const handleDisconnect = () => {
    setShowDropdown(false);
    disconnect();
  };

  const handleRefresh = async () => {
    setShowDropdown(false);
    await refreshBalance();
  };

  if (isConnecting) {
    return (
      <button className="btn btn-primary" disabled style={{ opacity: 0.7 }}>
        <span className="spinner">⟳</span> Connecting...
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="wallet-connected" ref={dropdownRef}>
        <div className="wallet-info">
          <div className="wallet-balances">
            <span className="wallet-bal-btc">{btcBalance.toFixed(4)} BTC</span>
            <span className="wallet-bal-sep">|</span>
            <span className="wallet-bal-usdt">{usdtBalance.toLocaleString()} USDT</span>
          </div>
          <button 
            className="wallet-address-btn" 
            onClick={() => setShowDropdown(!showDropdown)}
            title="Wallet options"
          >
            <span className="wallet-dot"></span>
            {formatAddress(address)}
            <span className="wallet-chevron">{showDropdown ? '▲' : '▼'}</span>
          </button>
        </div>

        {showDropdown && (
          <div className="wallet-dropdown">
            <div className="wallet-dropdown-header">
              <span className="wallet-dropdown-type">
                {walletType === 'opwallet' ? '🟢 OPWallet' : '🔵 Demo Wallet'}
              </span>
            </div>
            <button className="wallet-dropdown-item" onClick={handleRefresh}>
              🔄 Refresh Balance
            </button>
            <button className="wallet-dropdown-item" onClick={handleSwitchWallet}>
              🔃 Switch Wallet
            </button>
            <div className="wallet-dropdown-divider" />
            <button className="wallet-dropdown-item wallet-dropdown-danger" onClick={handleDisconnect}>
              ⏏️ Disconnect
            </button>
          </div>
        )}

        <style>{`
          .wallet-connected {
            display: flex;
            align-items: center;
            position: relative;
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
            border-color: var(--color-accent);
          }
          .wallet-chevron {
            font-size: 0.6rem;
            color: var(--color-text-muted);
          }
          .wallet-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--color-success);
            animation: pulse 2s ease-in-out infinite;
          }
          .wallet-dropdown {
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            min-width: 220px;
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            z-index: 100;
            overflow: hidden;
            animation: slideUp 0.15s ease-out;
          }
          .wallet-dropdown-header {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--color-border);
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          }
          .wallet-dropdown-type {
            font-weight: 600;
          }
          .wallet-dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
            padding: 0.625rem 1rem;
            background: none;
            border: none;
            color: var(--color-text-secondary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: all var(--transition-fast);
            text-align: left;
          }
          .wallet-dropdown-item:hover {
            background: var(--color-bg-input);
            color: var(--color-text-primary);
          }
          .wallet-dropdown-danger:hover {
            color: var(--color-danger) !important;
          }
          .wallet-dropdown-divider {
            height: 1px;
            background: var(--color-border);
            margin: 0.25rem 0;
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
