import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_BTC_PRICE_USD } from '../utils/constants';

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
  const [network, setNetwork] = useState('testnet');
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for OPWallet on mount
  useEffect(() => {
    const saved = localStorage.getItem('hodllend_wallet');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setIsConnected(true);
        setAddress(data.address);
        setBtcBalance(data.btcBalance);
        setUsdtBalance(data.usdtBalance);
        setNetwork(data.network || 'testnet');
      } catch {
        localStorage.removeItem('hodllend_wallet');
      }
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Try real OPWallet first
      if (typeof window !== 'undefined' && window.opnet) {
        try {
          const accounts = await window.opnet.requestAccounts();
          if (accounts && accounts.length > 0) {
            const addr = accounts[0];
            const balance = await window.opnet.getBalance();
            
            setAddress(addr);
            setBtcBalance(balance?.confirmed ? balance.confirmed / 1e8 : 0.5);
            setUsdtBalance(10000); // Mock USDT balance
            setIsConnected(true);
            setNetwork('testnet');

            localStorage.setItem('hodllend_wallet', JSON.stringify({
              address: addr,
              btcBalance: balance?.confirmed ? balance.confirmed / 1e8 : 0.5,
              usdtBalance: 10000,
              network: 'testnet',
            }));
            return;
          }
        } catch (err) {
          console.log('OPWallet connection failed, using mock:', err);
        }
      }

      // Fallback: simulate wallet connection for demo
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockAddress = '0x' + Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');

      const mockBtcBalance = 0.5;
      const mockUsdtBalance = 10000;

      setAddress(mockAddress);
      setBtcBalance(mockBtcBalance);
      setUsdtBalance(mockUsdtBalance);
      setIsConnected(true);
      setNetwork('testnet');

      localStorage.setItem('hodllend_wallet', JSON.stringify({
        address: mockAddress,
        btcBalance: mockBtcBalance,
        usdtBalance: mockUsdtBalance,
        network: 'testnet',
      }));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress('');
    setBtcBalance(0);
    setUsdtBalance(0);
    localStorage.removeItem('hodllend_wallet');
  }, []);

  const value = {
    isConnected,
    isConnecting,
    address,
    btcBalance,
    usdtBalance,
    network,
    btcPrice: MOCK_BTC_PRICE_USD,
    connect,
    disconnect,
    // Helpers
    btcValueUSD: btcBalance * MOCK_BTC_PRICE_USD,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
