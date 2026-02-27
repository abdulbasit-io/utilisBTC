import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { fundLoan } from '../utils/lendingEngine';
import { fundLoanOnChain } from '../utils/contractService';
import { formatBTC, formatUSDT, formatPercent, formatUSD } from '../utils/formatters';
import { MOCK_BTC_PRICE_USD, PLATFORM_FEE_RATE } from '../utils/constants';

export default function LendModal({ loan, onClose, onFunded, chainStatus }) {
  const { address, usdtBalance, isRealWallet } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const collateralValueUSD = loan.btcCollateral * MOCK_BTC_PRICE_USD;
  const lenderEarnings = loan.interest - (loan.interest * PLATFORM_FEE_RATE);

  const handleFund = async () => {
    setError('');

    if (loan.usdtAmount > usdtBalance) {
      return setError('Insufficient USDT balance');
    }

    setIsSubmitting(true);
    try {
      // Try on-chain first
      if (isRealWallet && chainStatus === 'online') {
        try {
          await fundLoanOnChain(address, loan.id);
          onFunded?.();
          onClose();
          return;
        } catch (e) {
          console.warn('On-chain fund failed, using local:', e);
        }
      }

      // Fallback: local
      await new Promise(r => setTimeout(r, 1200));
      fundLoan(loan.id, address);
      onFunded?.();
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
          <h3 className="modal-title">💰 Fund This Loan</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="glass-card" style={{ padding: 'var(--space-5)', background: 'var(--color-bg-glass)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Loan Details
            </h4>
            <div className="info-row">
              <span className="info-label">Loan Amount</span>
              <span className="info-value" style={{ color: 'var(--color-success)' }}>{formatUSDT(loan.usdtAmount)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">BTC Collateral</span>
              <span className="info-value" style={{ color: 'var(--color-accent)' }}>{formatBTC(loan.btcCollateral)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Collateral Value</span>
              <span className="info-value">{formatUSD(collateralValueUSD)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Collateral Ratio</span>
              <span className="info-value" style={{ color: 'var(--color-success)' }}>{formatPercent(loan.collateralRatio)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Duration</span>
              <span className="info-value">{loan.durationDays} days</span>
            </div>
            <div className="info-row">
              <span className="info-label">Interest Rate</span>
              <span className="info-value">{formatPercent(loan.interestRate)} APR</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 'var(--space-5)', background: 'var(--color-accent-subtle)', border: '1px solid rgba(247, 147, 26, 0.2)' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Returns
            </h4>
            <div className="info-row">
              <span className="info-label">You Supply</span>
              <span className="info-value">{formatUSDT(loan.usdtAmount)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Interest Earned</span>
              <span className="info-value" style={{ color: 'var(--color-success)' }}>+{formatUSDT(lenderEarnings)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">You Receive Back</span>
              <span className="info-value" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-accent)' }}>
                {formatUSDT(loan.usdtAmount + lenderEarnings)}
              </span>
            </div>
          </div>

          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-info-bg)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-info)',
            lineHeight: 1.6,
          }}>
            ℹ️ <strong>Protection:</strong> If the borrower fails to repay within {loan.durationDays} days, 
            you can liquidate their {formatBTC(loan.btcCollateral)} collateral (worth {formatUSD(collateralValueUSD)}).
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
            className="btn btn-success"
            onClick={handleFund}
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? '⟳ Funding...' : `💰 Fund ${formatUSDT(loan.usdtAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
