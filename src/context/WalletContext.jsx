import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_BTC_PRICE_USD, NETWORK, LINKS } from '../utils/constants';
import { getProvider, getBalance as providerGetBalance } from '../utils/opnetProvider';
import { getBorrowerLoans } from '../utils/lendingEngine';

const WalletContext = createContext(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export function WalletProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [btcBalance, setBtcBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [network, setNetwork] = useState(NETWORK);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState('none');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Check OPWallet availability
  const isOPWalletAvailable = () => {
    return typeof window !== 'undefined' && window.opnet;
  };

  // Calculate locked collateral from active loans
  const updateLockedBalance = useCallback((addr) => {
    if (!addr) return;
    try {
      const loans = getBorrowerLoans(addr);
      const locked = loans
        .filter(l => l.status === 'pending' || l.status === 'active')
        .reduce((sum, l) => sum + l.btcCollateral, 0);
      setLockedBalance(locked);
    } catch {
      setLockedBalance(0);
    }
  }, []);

  // Fetch on-chain balance
  const fetchOnChainBalance = useCallback(async (addr) => {
    try {
      const balance = await providerGetBalance(addr);
      if (balance !== null) {
        const btc = Number(balance) / 1e8;
        setBtcBalance(btc);
      }
    } catch (err) {
      console.warn('Failed to fetch on-chain balance:', err);
    }
  }, []);

  // Check for saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem('utilisbtc_wallet');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setIsConnected(true);
        setAddress(data.address);
        setBtcBalance(data.btcBalance);
        setUsdtBalance(data.usdtBalance);
        setNetwork(data.network || NETWORK);
        setWalletType(data.walletType || 'opwallet');
        updateLockedBalance(data.address);
        
        if (data.walletType === 'opwallet' && data.address) {
          fetchOnChainBalance(data.address);
        }
      } catch {
        localStorage.removeItem('utilisbtc_wallet');
      }
    }
  }, [fetchOnChainBalance, updateLockedBalance]);

  // Connect wallet — OPWallet ONLY
  const connect = useCallback(async () => {
    // Must have OPWallet installed
    if (!isOPWalletAvailable()) {
      setShowInstallPrompt(true);
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.opnet.requestAccounts();
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        
        // Get balance
        let btcBal = 0;
        try {
          const walletBalance = await window.opnet.getBalance();
          if (walletBalance?.confirmed !== undefined) {
            btcBal = walletBalance.confirmed / 1e8;
          }
        } catch (e) {
          console.warn('OPWallet getBalance failed, trying provider:', e);
          try {
            const provBalance = await providerGetBalance(addr);
            if (provBalance !== null) {
              btcBal = Number(provBalance) / 1e8;
            }
          } catch {}
        }

        setAddress(addr);
        setBtcBalance(btcBal);
        setUsdtBalance(10000); // Mock USDT until token deployed
        setIsConnected(true);
        setNetwork(NETWORK);
        setWalletType('opwallet');
        updateLockedBalance(addr);

        localStorage.setItem('utilisbtc_wallet', JSON.stringify({
          address: addr,
          btcBalance: btcBal,
          usdtBalance: 10000,
          network: NETWORK,
          walletType: 'opwallet',
        }));
      }
    } catch (err) {
      console.error('OPWallet connection failed:', err);
      // Still show install prompt if connection fails
      setShowInstallPrompt(true);
    } finally {
      setIsConnecting(false);
    }
  }, [updateLockedBalance]);

  // Disconnect
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress('');
    setBtcBalance(0);
    setLockedBalance(0);
    setUsdtBalance(0);
    setWalletType('none');
    localStorage.removeItem('utilisbtc_wallet');
  }, []);

  // Refresh balance + locked amounts
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !address) return;
    
    updateLockedBalance(address);

    if (walletType === 'opwallet') {
      try {
        if (isOPWalletAvailable()) {
          const walletBalance = await window.opnet.getBalance();
          if (walletBalance?.confirmed !== undefined) {
            setBtcBalance(walletBalance.confirmed / 1e8);
          }
        }
        await fetchOnChainBalance(address);
      } catch (err) {
        console.warn('Balance refresh failed:', err);
      }
    }
  }, [isConnected, address, walletType, fetchOnChainBalance, updateLockedBalance]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
  }, []);

  const availableBalance = Math.max(0, btcBalance - lockedBalance);

  const value = {
    // State
    isConnected,
    isConnecting,
    address,
    btcBalance,
    lockedBalance,
    availableBalance,
    usdtBalance,
    network,
    walletType,
    btcPrice: MOCK_BTC_PRICE_USD,
    showInstallPrompt,
    
    // Actions
    connect,
    disconnect,
    refreshBalance,
    updateLockedBalance,
    dismissInstallPrompt,
    
    // Helpers
    btcValueUSD: btcBalance * MOCK_BTC_PRICE_USD,
    isRealWallet: walletType === 'opwallet',
    isOPWalletInstalled: isOPWalletAvailable(),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      
      {/* OPWallet Install Prompt Modal */}
      {showInstallPrompt && (
        <div className="modal-overlay" onClick={dismissInstallPrompt}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📥 OPWallet Required</h3>
              <button className="modal-close" onClick={dismissInstallPrompt}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🦊</div>
              <p style={{ 
                fontSize: 'var(--font-size-md)', 
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-6)',
              }}>
                utilisBTC requires <strong style={{ color: 'var(--color-accent)' }}>OPWallet</strong> to interact with the Bitcoin L1 network. Install the browser extension to get started.
              </p>
              <a 
                href={LINKS.OPWALLET} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-3)' }}
              >
                📥 Install OPWallet
              </a>
              <button 
                className="btn btn-secondary" 
                onClick={dismissInstallPrompt}
                style={{ width: '100%' }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
}
