import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  getAvailableLoans,
  getLenderLoans,
  liquidateLoan,
  seedDemoData,
} from '../utils/lendingEngine';
import { formatUSDT, formatUSD } from '../utils/formatters';
import { PLATFORM_FEE_RATE } from '../utils/constants';
import LoanCard from './LoanCard';
import LendModal from './LendModal';

export default function LenderDashboard() {
  const { isConnected, address, usdtBalance, connect } = useWallet();
  const [availableLoans, setAvailableLoans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [tab, setTab] = useState('marketplace');

  const loadData = useCallback(() => {
    seedDemoData(address);
    setAvailableLoans(getAvailableLoans());
    if (address) {
      setMyInvestments(getLenderLoans(address));
    }
  }, [address]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLiquidate = async (loanId) => {
    try {
      liquidateLoan(loanId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeInvestments = myInvestments.filter(l => l.status === 'active');
  const totalLent = activeInvestments.reduce((sum, l) => sum + l.usdtAmount, 0);
  const totalExpectedReturn = activeInvestments.reduce((sum, l) => {
    const lenderEarnings = l.interest - (l.interest * PLATFORM_FEE_RATE);
    return sum + l.usdtAmount + lenderEarnings;
  }, 0);

  if (!isConnected) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3 className="empty-title">Connect Your Wallet</h3>
            <p className="empty-desc">Connect your OPWallet to start lending USDT and earning interest.</p>
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
            <h1 className="dashboard-title">💰 Lender Dashboard</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
              Supply USDT to earn interest — backed by Bitcoin collateral
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">USDT Balance</div>
            <div className="dashboard-stat-value" style={{ color: 'var(--color-success)' }}>
              {formatUSDT(usdtBalance)}
            </div>
          </div>
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">Total Lent</div>
            <div className="dashboard-stat-value" style={{ color: 'var(--color-info)' }}>
              {formatUSDT(totalLent)}
            </div>
          </div>
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">Expected Returns</div>
            <div className="dashboard-stat-value" style={{ color: 'var(--color-accent)' }}>
              {formatUSD(totalExpectedReturn)}
            </div>
          </div>
          <div className="glass-card dashboard-stat">
            <div className="dashboard-stat-label">Open Requests</div>
            <div className="dashboard-stat-value">
              {availableLoans.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${tab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setTab('marketplace')}
          >
            🏪 Loan Marketplace ({availableLoans.length})
          </button>
          <button
            className={`tab-btn ${tab === 'investments' ? 'active' : ''}`}
            onClick={() => setTab('investments')}
          >
            📊 My Investments ({myInvestments.length})
          </button>
        </div>

        {/* Marketplace Tab */}
        {tab === 'marketplace' && (
          <>
            {availableLoans.length === 0 ? (
              <div className="glass-card empty-state">
                <div className="empty-icon">🏪</div>
                <h3 className="empty-title">No open loan requests</h3>
                <p className="empty-desc">
                  Check back soon — borrowers are always looking for lenders.
                </p>
              </div>
            ) : (
              <div className="loans-list">
                {availableLoans.map(loan => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    showBorrower
                    actions={
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setSelectedLoan(loan)}
                      >
                        💰 Fund Loan
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Investments Tab */}
        {tab === 'investments' && (
          <>
            {myInvestments.length === 0 ? (
              <div className="glass-card empty-state">
                <div className="empty-icon">📊</div>
                <h3 className="empty-title">No investments yet</h3>
                <p className="empty-desc">
                  Fund a loan from the marketplace to start earning interest.
                </p>
                <button className="btn btn-primary" onClick={() => setTab('marketplace')}>
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="loans-list">
                {myInvestments.map(loan => {
                  const isExpired = loan.expiresAt && new Date(loan.expiresAt) < new Date();
                  return (
                    <LoanCard
                      key={loan.id}
                      loan={loan}
                      showBorrower
                      actions={
                        loan.status === 'active' && isExpired ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleLiquidate(loan.id)}
                          >
                            ⚠️ Liquidate
                          </button>
                        ) : null
                      }
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Lend Modal */}
        {selectedLoan && (
          <LendModal
            loan={selectedLoan}
            onClose={() => setSelectedLoan(null)}
            onFunded={loadData}
          />
        )}
      </div>
    </div>
  );
}
