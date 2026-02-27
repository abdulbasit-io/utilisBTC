import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { getBorrowerLoans, repayLoan, cancelLoan, seedDemoData } from '../utils/lendingEngine';
import { formatBTC, formatUSDT, formatUSD } from '../utils/formatters';
import { MOCK_BTC_PRICE_USD } from '../utils/constants';
import LoanCard from './LoanCard';
import CreateLoanModal from './CreateLoanModal';

export default function BorrowerDashboard() {
  const { isConnected, address, btcBalance, availableBalance, lockedBalance, connect, updateLockedBalance } = useWallet();
  const [loans, setLoans] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadLoans = useCallback(() => {
    if (address) {
      seedDemoData(address);
      setLoans(getBorrowerLoans(address));
      updateLockedBalance(address);
    }
  }, [address, updateLockedBalance]);

  useEffect(() => { loadLoans(); }, [loadLoans]);

  const handleRepay = async (loanId) => {
    try {
      repayLoan(loanId);
      loadLoans();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (loanId) => {
    try {
      cancelLoan(loanId);
      loadLoans();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredLoans = filter === 'all'
    ? loans
    : loans.filter(l => l.status === filter);

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalCollateral = activeLoans.reduce((sum, l) => sum + l.btcCollateral, 0);
  const totalBorrowed = activeLoans.reduce((sum, l) => sum + l.usdtAmount, 0);

  if (!isConnected) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <h3 className="empty-title">Connect Your Wallet</h3>
            <p className="empty-desc">Connect your OPWallet to start borrowing against your Bitcoin.</p>
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
            <h1 className="dashboard-title">🏦 Borrower Dashboard</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
              Lock BTC as collateral and borrow USDT
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowCreateModal(true)}>
            <span>+</span> New Loan Request
          </button>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">Available BTC</div>
            <div className="dashboard-stat-value" style={{ color: 'var(--color-accent)' }}>
              {formatBTC(availableBalance)}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Total: {formatBTC(btcBalance)} · Locked: {formatBTC(lockedBalance)}
            </div>
          </div>
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">Locked Collateral</div>
            <div className="dashboard-stat-value" style={{ color: 'var(--color-warning)' }}>
              {formatBTC(totalCollateral)}
            </div>
          </div>
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">Total Borrowed</div>
            <div className="dashboard-stat-value" style={{ color: 'var(--color-success)' }}>
              {formatUSDT(totalBorrowed)}
            </div>
          </div>
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">Active Loans</div>
            <div className="dashboard-stat-value">
              {activeLoans.length}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="tab-nav">
          {[
            ['all', 'All Loans'],
            ['pending', 'Pending'],
            ['active', 'Active'],
            ['repaid', 'Repaid'],
            ['cancelled', 'Cancelled'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`tab-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loans List */}
        {filteredLoans.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">No loans yet</h3>
            <p className="empty-desc">
              Create your first loan request to borrow USDT against your Bitcoin.
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <span>+</span> Create Loan Request
            </button>
          </div>
        ) : (
          <div className="loans-list">
            {filteredLoans.map(loan => (
              <LoanCard
                key={loan.id}
                loan={loan}
                showLender
                actions={
                  <>
                    {loan.status === 'active' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleRepay(loan.id)}>
                        💳 Repay
                      </button>
                    )}
                    {loan.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(loan.id)}>
                        ✕ Cancel
                      </button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateLoanModal
            onClose={() => setShowCreateModal(false)}
            onCreated={loadLoans}
          />
        )}
      </div>
    </div>
  );
}
