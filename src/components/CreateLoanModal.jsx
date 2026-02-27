import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { createLoanRequest } from '../utils/lendingEngine';
import { formatUSD, formatUSDT, formatPercent, calcInterest } from '../utils/formatters';
import { MIN_COLLATERAL_RATIO, PLATFORM_FEE_RATE, MOCK_BTC_PRICE_USD } from '../utils/constants';

export default function CreateLoanModal({ onClose, onCreated }) {
  const { address, btcBalance } = useWallet();
  const [btcCollateral, setBtcCollateral] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [interestRate, setInterestRate] = useState('8');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const btcVal = parseFloat(btcCollateral) || 0;
  const usdtVal = parseFloat(usdtAmount) || 0;
  const durationVal = parseInt(durationDays) || 0;
  const rateVal = (parseFloat(interestRate) || 0) / 100;

  const collateralValueUSD = btcVal * MOCK_BTC_PRICE_USD;
  const ratio = usdtVal > 0 ? collateralValueUSD / usdtVal : 0;
  const interest = calcInterest(usdtVal, rateVal, durationVal);
  const platformFee = interest * PLATFORM_FEE_RATE;
  const totalRepayment = usdtVal + interest;

  const maxBorrow = collateralValueUSD / MIN_COLLATERAL_RATIO;

  const handleAutoFillBorrow = () => {
    if (btcVal > 0) {
      setUsdtAmount(Math.floor(maxBorrow).toString());
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (btcVal <= 0) return setError('Enter BTC collateral amount');
    if (btcVal > btcBalance) return setError('Insufficient BTC balance');
    if (usdtVal <= 0) return setError('Enter USDT loan amount');
    if (durationVal < 7 || durationVal > 365) return setError('Duration must be 7–365 days');
    if (rateVal <= 0 || rateVal > 0.5) return setError('Interest rate must be 0.1%–50%');
    if (ratio < MIN_COLLATERAL_RATIO) {
      return setError(`Collateral ratio (${(ratio * 100).toFixed(0)}%) is below minimum ${(MIN_COLLATERAL_RATIO * 100).toFixed(0)}%`);
    }

    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1000)); // Simulate tx
      createLoanRequest({
        borrower: address,
        btcCollateral: btcVal,
        usdtAmount: usdtVal,
        durationDays: durationVal,
        interestRate: rateVal,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">🏦 Create Loan Request</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label>BTC Collateral</label>
            <div className="input-with-suffix">
              <input
                type="number"
                className="input"
                placeholder="0.05"
                step="0.001"
                min="0.001"
                value={btcCollateral}
                onChange={e => setBtcCollateral(e.target.value)}
              />
              <span className="input-suffix">BTC</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Balance: {btcBalance.toFixed(4)} BTC</span>
              <span>≈ {formatUSD(collateralValueUSD)}</span>
            </div>
          </div>

          <div className="input-group">
            <label>
              USDT to Borrow
              {btcVal > 0 && (
                <button onClick={handleAutoFillBorrow} style={{
                  marginLeft: '0.5rem',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}>
                  Max: {formatUSD(maxBorrow)}
                </button>
              )}
            </label>
            <div className="input-with-suffix">
              <input
                type="number"
                className="input"
                placeholder="2500"
                step="100"
                min="1"
                value={usdtAmount}
                onChange={e => setUsdtAmount(e.target.value)}
              />
              <span className="input-suffix">USDT</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label>Duration (days)</label>
              <input
                type="number"
                className="input"
                placeholder="30"
                min="7"
                max="365"
                value={durationDays}
                onChange={e => setDurationDays(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Interest Rate (% APR)</label>
              <input
                type="number"
                className="input"
                placeholder="8"
                step="0.5"
                min="0.1"
                max="50"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card" style={{ padding: 'var(--space-4)', background: 'var(--color-bg-glass)' }}>
            <div className="info-row">
              <span className="info-label">Collateral Ratio</span>
              <span className="info-value" style={{
                color: ratio >= MIN_COLLATERAL_RATIO ? 'var(--color-success)' : 'var(--color-danger)',
              }}>
                {ratio > 0 ? formatPercent(ratio) : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Interest to Pay</span>
              <span className="info-value">{formatUSDT(interest)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Platform Fee ({formatPercent(PLATFORM_FEE_RATE)})</span>
              <span className="info-value">{formatUSDT(platformFee)}</span>
            </div>
            <div className="info-row" style={{ borderBottom: 'none' }}>
              <span className="info-label" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Total Repayment</span>
              <span className="info-value" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent)' }}>
                {formatUSDT(totalRepayment)}
              </span>
            </div>
          </div>

          {error && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: 'var(--font-size-sm)',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? '⟳ Creating...' : '🔐 Lock BTC & Request Loan'}
          </button>
        </div>
      </div>
    </div>
  );
}
