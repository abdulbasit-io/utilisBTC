import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  getAvailableLoans,
  getLenderLoans,
  liquidateLoan,
  fundLoan,
  seedDemoData,
} from '../utils/lendingEngine';
import {
  fundLoanOnChain, liquidateLoanOnChain,
  getAllOnChainLoans, isContractAvailable, getContractAddress,
} from '../utils/contractService';
import { formatUSDT, formatUSD } from '../utils/formatters';
import { PLATFORM_FEE_RATE } from '../utils/constants';
import LoanCard from './LoanCard';
import LendModal from './LendModal';

export default function LenderDashboard() {
  const { isConnected, address, usdtBalance, connect, isRealWallet } = useWallet();
  const [availableLoans, setAvailableLoans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [tab, setTab] = useState('marketplace');
  const [chainStatus, setChainStatus] = useState('checking');
  const [txPending, setTxPending] = useState(null);

  const loadData = useCallback(async () => {
    seedDemoData(address);
    setAvailableLoans(getAvailableLoans());
    if (address) {
      setMyInvestments(getLenderLoans(address));
    }

    // Try on-chain loans too
    if (isRealWallet) {
      try {
        const onChainLoans = await getAllOnChainLoans();
        if (onChainLoans.length > 0) {
          const onChainPending = onChainLoans.filter(l => l.status === 'pending');
          const onChainMine = onChainLoans.filter(l => l.lender === address);
          if (onChainPending.length > 0) {
            setAvailableLoans(prev => [...onChainPending, ...prev]);
          }
          if (onChainMine.length > 0) {
            setMyInvestments(prev => [...onChainMine, ...prev]);
          }
        }
      } catch (e) {
        console.warn('On-chain loan fetch failed:', e);
      }
    }
  }, [address, isRealWallet]);

  useEffect(() => { loadData(); }, [loadData]);

  // Check contract availability
  useEffect(() => {
    async function checkChain() {
      try {
        const available = await isContractAvailable();
        setChainStatus(available ? 'online' : 'offline');
      } catch {
        setChainStatus('offline');
      }
    }
    if (isRealWallet) checkChain();
    else setChainStatus('offline');
  }, [isRealWallet]);

  const handleLiquidate = async (loanId) => {
    try {
      if (isRealWallet && chainStatus === 'online') {
        setTxPending('Liquidating loan on-chain...');
        try {
          await liquidateLoanOnChain(address, loanId);
          setTxPending(null);
          loadData();
          return;
        } catch (e) {
          console.warn('On-chain liquidate failed:', e);
          setTxPending(null);
        }
      }
      liquidateLoan(loanId);
      loadData();
    } catch (err) {
      setTxPending(null);
      alert(err.message);
    }
  };

  const activeInvestments = myInvestments.filter(l => l.status === 'active');
  const totalLent = activeInvestments.reduce((sum, l) => sum + l.usdtAmount, 0);
  const totalExpectedReturn = activeInvestments.reduce((sum, l) => {
    const lenderEarnings = (l.interest || 0) - ((l.interest || 0) * PLATFORM_FEE_RATE);
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
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Supply USDT to earn interest — backed by Bitcoin collateral
              {chainStatus === 'online' && (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  ⛓️ On-Chain
                </span>
              )}
              {chainStatus === 'offline' && (
                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                  📋 Simulation
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Contract info */}
        {getContractAddress() && chainStatus === 'online' && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-success)',
            marginBottom: 'var(--space-4)',
          }}>
            ⛓️ Connected to contract: <code style={{ opacity: 0.8 }}>{getContractAddress()}</code>
          </div>
        )}

        {/* Pending tx */}
        {txPending && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-accent-subtle)',
            border: '1px solid rgba(247, 147, 26, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-accent)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            <span style={{ animation: 'pulse 1s infinite' }}>⟳</span> {txPending}
          </div>
        )}

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
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => setSelectedLoan(loan)}
                          disabled={!!txPending}
                        >
                          💰 Fund Loan
                        </button>
                        {loan.onChain && (
                          <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>⛓️</span>
                        )}
                      </>
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
                            disabled={!!txPending}
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
            chainStatus={chainStatus}
          />
        )}
      </div>
    </div>
  );
}
