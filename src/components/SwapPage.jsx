import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { MOCK_BTC_PRICE_USD, CONTRACTS } from '../utils/constants';
import { formatBTC } from '../utils/formatters';

// HODL exchange rate: 1 BTC = 97,500 HODL (pegged to BTC price in USD)
const HODL_PER_BTC = MOCK_BTC_PRICE_USD;
const MIN_SWAP = 0.0001; // min BTC to swap

export default function SwapPage() {
  const { isConnected, address, btcBalance, usdtBalance, connect, refreshBalance, isRealWallet } = useWallet();
  const [btcAmount, setBtcAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHistory, setTxHistory] = useState([]);

  const btcVal = parseFloat(btcAmount) || 0;
  const hodlReceived = btcVal * HODL_PER_BTC;

  // Load tx history
  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('utilisbtc_swaps') || '[]');
      setTxHistory(h);
    } catch { setTxHistory([]); }
  }, []);

  const handleSwap = async () => {
    setError('');
    setSuccess('');

    if (btcVal < MIN_SWAP) return setError(`Minimum swap is ${MIN_SWAP} BTC`);
    if (btcVal > btcBalance) return setError(`Insufficient BTC. You have ${formatBTC(btcBalance)}`);

    setIsSwapping(true);
    try {
      // On-chain: attempt to call the contract's mint or transfer
      // Since the full supply was minted to deployer, a real swap would require
      // the deployer to set up a dispenser contract or use OP_NET's native swap.
      // For demo: simulate the exchange and credit HODL locally.
      if (isRealWallet && window.opnet?.web3) {
        // Try on-chain swap via the contract
        try {
          const { getContract } = await import('opnet');
          const { networks } = await import('@btc-vision/bitcoin');
          const { getProvider } = await import('../utils/opnetProvider');
          const abiJson = (await import('../../contract/abis/utilisBTC.abi.json')).default;
          const rawAbi = abiJson.functions || abiJson;
          const abi = rawAbi.map(fn => ({ ...fn, type: (fn.type || 'function').toLowerCase() }));

          const provider = getProvider();
          const contract = getContract(CONTRACTS.UTILISBTC, abi, provider, networks.testnet);

          // Try mint (OP20 base might expose it if deployer is calling)
          // This will likely revert for non-owner, which is fine — we catch and simulate
          const amountSats = BigInt(Math.round(hodlReceived * 1e8));
          const simulation = await contract.mint(address, amountSats);

          if (!simulation.revert) {
            const receipt = await simulation.sendTransaction({
              signer: null,
              mldsaSigner: null,
              refundTo: address,
              maximumAllowedSatToSpend: 10_000_000n,
              network: networks.testnet,
            });
            console.log('[utilisBTC] Swap tx:', receipt.transactionId);
            recordSwap(btcVal, hodlReceived, receipt.transactionId);
            setSuccess(`✅ Swapped ${btcVal} BTC → ${hodlReceived.toLocaleString()} HODL on-chain!`);
            await refreshBalance();
            setBtcAmount('');
            setIsSwapping(false);
            return;
          }
        } catch (e) {
          console.warn('[utilisBTC] On-chain swap failed, using simulation:', e.message);
        }
      }

      // Fallback: simulate the swap locally
      await new Promise(r => setTimeout(r, 1500));

      // Credit HODL balance in localStorage
      const currentHodl = parseFloat(localStorage.getItem('utilisbtc_hodl_sim') || '0');
      const newHodl = currentHodl + hodlReceived;
      localStorage.setItem('utilisbtc_hodl_sim', newHodl.toString());

      const txId = `sim_${Date.now().toString(36)}`;
      recordSwap(btcVal, hodlReceived, txId);
      setSuccess(`✅ Swapped ${btcVal} BTC → ${hodlReceived.toLocaleString()} HODL (simulation)`);
      await refreshBalance();
      setBtcAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSwapping(false);
    }
  };

  const recordSwap = (btcIn, hodlOut, txId) => {
    const swap = {
      id: txId,
      btcIn,
      hodlOut,
      rate: HODL_PER_BTC,
      timestamp: new Date().toISOString(),
    };
    const history = [swap, ...txHistory].slice(0, 10);
    setTxHistory(history);
    localStorage.setItem('utilisbtc_swaps', JSON.stringify(history));
  };

  const handleMax = () => {
    const max = Math.max(0, btcBalance - 0.0001); // keep dust for fees
    setBtcAmount(max > 0 ? max.toFixed(8) : '');
  };

  const handlePreset = (fraction) => {
    const amount = btcBalance * fraction;
    setBtcAmount(amount > MIN_SWAP ? amount.toFixed(8) : '');
  };

  if (!isConnected) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">🔄</div>
            <h3 className="empty-title">Connect Your Wallet</h3>
            <p className="empty-desc">Connect your OPWallet to swap BTC for HODL tokens.</p>
            <button className="btn btn-primary btn-lg" onClick={connect}>
              <span>🔗</span> Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">🔄 Swap BTC → HODL</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
              Exchange Bitcoin for HODL tokens to fund loans on the marketplace
            </p>
          </div>
        </div>

        {/* Rate info */}
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-success)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>💱 Rate: <strong>1 BTC = {HODL_PER_BTC.toLocaleString()} HODL</strong></span>
          <span>Your HODL: <strong>{usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} HODL</strong></span>
        </div>

        {/* Swap card */}
        <div className="glass-card" style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--space-8)' }}>
          {/* From: BTC */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                You Send
              </label>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Balance: {formatBTC(btcBalance)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              background: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}>
              <input
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.00"
                value={btcAmount}
                onChange={e => { setBtcAmount(e.target.value); setError(''); setSuccess(''); }}
                style={{
                  flex: 1,
                  padding: 'var(--space-4)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: '0 var(--space-4)', 
                background: 'rgba(247, 147, 26, 0.1)',
                borderLeft: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: 'var(--font-size-lg)' }}>₿</span>
                <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>BTC</span>
              </div>
            </div>
            {/* Quick amount buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              {[0.25, 0.5, 0.75].map(f => (
                <button key={f} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                  onClick={() => handlePreset(f)}>{f * 100}%</button>
              ))}
              <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                onClick={handleMax}>MAX</button>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)', fontSize: '1.5rem' }}>
            ⬇️
          </div>

          {/* To: HODL */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              You Receive
            </label>
            <div style={{
              display: 'flex',
              background: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}>
              <div style={{
                flex: 1, padding: 'var(--space-4)',
                fontSize: 'var(--font-size-lg)', fontWeight: 700,
                color: hodlReceived > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
              }}>
                {hodlReceived > 0 ? hodlReceived.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: '0 var(--space-4)',
                background: 'rgba(16, 185, 129, 0.1)',
                borderLeft: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: 'var(--font-size-lg)' }}>🪙</span>
                <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>HODL</span>
              </div>
            </div>
          </div>

          {/* Swap details */}
          {btcVal > 0 && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                <span>Exchange Rate</span>
                <span>1 BTC = {HODL_PER_BTC.toLocaleString()} HODL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                <span>You Send</span>
                <span style={{ color: 'var(--color-accent)' }}>{btcVal} BTC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>You Receive</span>
                <span style={{ color: 'var(--color-success)' }}>{hodlReceived.toLocaleString()} HODL</span>
              </div>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div style={{
              padding: 'var(--space-3)', marginBottom: 'var(--space-4)',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)', color: 'var(--color-danger)',
              fontSize: 'var(--font-size-sm)',
            }}>⚠️ {error}</div>
          )}
          {success && (
            <div style={{
              padding: 'var(--space-3)', marginBottom: 'var(--space-4)',
              background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)', color: 'var(--color-success)',
              fontSize: 'var(--font-size-sm)',
            }}>{success}</div>
          )}

          {/* Swap button */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', fontSize: 'var(--font-size-md)' }}
            onClick={handleSwap}
            disabled={isSwapping || btcVal <= 0}
          >
            {isSwapping ? '⟳ Swapping...' : `🔄 Swap ${btcVal > 0 ? btcVal + ' BTC' : ''} for HODL`}
          </button>
        </div>

        {/* Recent swaps */}
        {txHistory.length > 0 && (
          <div style={{ maxWidth: 520, margin: 'var(--space-6) auto 0' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Swaps
            </h3>
            {txHistory.map(tx => (
              <div key={tx.id} className="glass-card" style={{
                padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 'var(--font-size-sm)',
              }}>
                <div>
                  <span style={{ color: 'var(--color-accent)' }}>{tx.btcIn} BTC</span>
                  <span style={{ color: 'var(--color-text-muted)', margin: '0 var(--space-2)' }}>→</span>
                  <span style={{ color: 'var(--color-success)' }}>{tx.hodlOut.toLocaleString()} HODL</span>
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                  {new Date(tx.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
