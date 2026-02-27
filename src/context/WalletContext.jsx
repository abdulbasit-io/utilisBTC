import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_BTC_PRICE_USD, NETWORK } from '../utils/constants';
import { getProvider, getBalance as providerGetBalance } from '../utils/opnetProvider';

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
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [network, setNetwork] = useState(NETWORK);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState('none'); // 'opwallet' | 'mock' | 'none'
  const [blockNumber, setBlockNumber] = useState(null);

  // Check OPWallet availability
  const isOPWalletAvailable = () => {
    return typeof window !== 'undefined' && window.opnet;
  };

  // Fetch on-chain balance via OP_NET provider
  const fetchOnChainBalance = useCallback(async (addr) => {
    try {
      const balance = await providerGetBalance(addr);
      if (balance !== null) {
        // Balance comes in satoshis, convert to BTC
        const btc = typeof balance === 'bigint' 
          ? Number(balance) / 1e8 
          : Number(balance) / 1e8;
        setBtcBalance(btc);
      }
    } catch (err) {
      console.warn('Failed to fetch on-chain balance:', err);
    }
  }, []);

  // Check for saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem('hodllend_wallet');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setIsConnected(true);
        setAddress(data.address);
        setBtcBalance(data.btcBalance);
        setUsdtBalance(data.usdtBalance);
        setNetwork(data.network || NETWORK);
        setWalletType(data.walletType || 'mock');
        
        // If real wallet, refresh balance from chain
        if (data.walletType === 'opwallet' && data.address) {
          fetchOnChainBalance(data.address);
        }
      } catch {
        localStorage.removeItem('hodllend_wallet');
      }
    }

    // Test provider connection
    const testProvider = async () => {
      try {
        const provider = getProvider(NETWORK);
        if (provider) {
          const block = await provider.getBlockNumber();
          setBlockNumber(block);
        }
      } catch (err) {
        console.warn('Provider not available:', err);
      }
    };
    testProvider();
  }, [fetchOnChainBalance]);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);

    try {
      // ── Try real OPWallet first ──────────────────────────
      if (isOPWalletAvailable()) {
        try {
          const accounts = await window.opnet.requestAccounts();
          if (accounts && accounts.length > 0) {
            const addr = accounts[0];
            
            // Get balance from OPWallet
            let btcBal = 0.5; // fallback
            try {
              const walletBalance = await window.opnet.getBalance();
              if (walletBalance?.confirmed !== undefined) {
                btcBal = walletBalance.confirmed / 1e8;
              }
            } catch (e) {
              console.warn('OPWallet getBalance failed, trying provider:', e);
              // Try via OP_NET provider
              const provBalance = await providerGetBalance(addr);
              if (provBalance !== null) {
                btcBal = Number(provBalance) / 1e8;
              }
            }

            setAddress(addr);
            setBtcBalance(btcBal);
            setUsdtBalance(10000); // Mock USDT (no USDT token deployed yet)
            setIsConnected(true);
            setNetwork(NETWORK);
            setWalletType('opwallet');

            const walletData = {
              address: addr,
              btcBalance: btcBal,
              usdtBalance: 10000,
              network: NETWORK,
              walletType: 'opwallet',
            };
            localStorage.setItem('hodllend_wallet', JSON.stringify(walletData));
            return;
          }
        } catch (err) {
          console.log('OPWallet connection failed, using mock:', err);
        }
      }

      // ── Fallback: Mock wallet for demo ───────────────────
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockAddress = 'bc1q' + Array.from({ length: 38 }, () =>
        '0123456789abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 32)]
      ).join('');

      const mockBtcBalance = 0.5;
      const mockUsdtBalance = 10000;

      setAddress(mockAddress);
      setBtcBalance(mockBtcBalance);
      setUsdtBalance(mockUsdtBalance);
      setIsConnected(true);
      setNetwork(NETWORK);
      setWalletType('mock');

      const walletData = {
        address: mockAddress,
        btcBalance: mockBtcBalance,
        usdtBalance: mockUsdtBalance,
        network: NETWORK,
        walletType: 'mock',
      };
      localStorage.setItem('hodllend_wallet', JSON.stringify(walletData));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress('');
    setBtcBalance(0);
    setUsdtBalance(0);
    setWalletType('none');
    localStorage.removeItem('hodllend_wallet');
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !address) return;
    
    if (walletType === 'opwallet') {
      try {
        if (isOPWalletAvailable()) {
          const walletBalance = await window.opnet.getBalance();
          if (walletBalance?.confirmed !== undefined) {
            setBtcBalance(walletBalance.confirmed / 1e8);
          }
        }
        // Also try provider
        await fetchOnChainBalance(address);
      } catch (err) {
        console.warn('Balance refresh failed:', err);
      }
    }
  }, [isConnected, address, walletType, fetchOnChainBalance]);

  const value = {
    // State
    isConnected,
    isConnecting,
    address,
    btcBalance,
    usdtBalance,
    network,
    walletType,
    blockNumber,
    btcPrice: MOCK_BTC_PRICE_USD,
    
    // Actions
    connect,
    disconnect,
    refreshBalance,
    
    // Helpers
    btcValueUSD: btcBalance * MOCK_BTC_PRICE_USD,
    isRealWallet: walletType === 'opwallet',
    isOPWalletInstalled: isOPWalletAvailable(),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
