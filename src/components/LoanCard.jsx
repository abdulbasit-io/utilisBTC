import { STATUS_CONFIG } from '../utils/constants';
import { formatBTC, formatUSDT, formatTimeRemaining, formatPercent, formatAddress } from '../utils/formatters';

export default function LoanCard({ loan, actions, showBorrower = false, showLender = false }) {
  const statusCfg = STATUS_CONFIG[loan.status];
  const isExpired = loan.expiresAt && new Date(loan.expiresAt) < new Date();
  const isActive = loan.status === 'active';

  return (
    <div className="glass-card loan-card">
      <div>
        <div className="loan-field-label">Collateral</div>
        <div className="loan-field-value" style={{ color: 'var(--color-accent)' }}>
          {formatBTC(loan.btcCollateral)}
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Ratio: {formatPercent(loan.collateralRatio)}
        </div>
      </div>

      <div>
        <div className="loan-field-label">Loan Amount</div>
        <div className="loan-field-value" style={{ color: 'var(--color-success)' }}>
          {formatUSDT(loan.usdtAmount)}
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Interest: {formatPercent(loan.interestRate)} APR
        </div>
      </div>

      <div>
        <div className="loan-field-label">
          {isActive ? 'Time Left' : 'Duration'}
        </div>
        <div className="loan-field-value" style={{
          fontSize: 'var(--font-size-base)',
          color: isExpired && isActive ? 'var(--color-danger)' : 'var(--color-text-primary)',
        }}>
          {isActive
            ? formatTimeRemaining(loan.expiresAt)
            : `${loan.durationDays} days`
          }
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Repay: {formatUSDT(loan.totalRepayment)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
        <span className={`badge ${statusCfg.badge}`}>
          {statusCfg.icon} {statusCfg.label}
        </span>

        {showBorrower && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Borrower: {formatAddress(loan.borrower)}
          </div>
        )}
        {showLender && loan.lender && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Lender: {formatAddress(loan.lender)}
          </div>
        )}

        {actions && (
          <div className="loan-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
