import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { getBorrowerLoans, repayLoan, cancelLoan, seedDemoData, createLoanRequest } from '../utils/lendingEngine';
import { formatBTC, formatUSDT, formatUSD } from '../utils/formatters';
import { MOCK_BTC_PRICE_USD } from '../utils/constants';
import { 
  createLoanOnChain, repayLoanOnChain, cancelLoanOnChain,
  getAllOnChainLoans, isContractAvailable, getContractAddress 
} from '../utils/contractService';
import LoanCard from './LoanCard';
import CreateLoanModal from './CreateLoanModal';

export default function BorrowerDashboard() {
  const { isConnected, address, btcBalance, availableBalance, lockedBalance, connect, updateLockedBalance, isRealWallet } = useWallet();
  const [loans, setLoans] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [chainStatus, setChainStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [txPending, setTxPending] = useState(null); // active tx description

  const loadLoans = useCallback(async () => {
    if (!address) return;
    
    // Always load localStorage loans as base
    seedDemoData(address);
    const localLoans = getBorrowerLoans(address);
    setLoans(localLoans);
    updateLockedBalance(address);

    // Try to load on-chain loans too
    if (isRealWallet) {
      try {
        const onChainLoans = await getAllOnChainLoans();
        if (onChainLoans.length > 0) {
          // Merge: show on-chain loans with a badge, keep local loans that aren't on-chain
          const mergedLoans = [...onChainLoans.filter(l => l.borrower === address || l.borrower === ''), ...localLoans];
          setLoans(mergedLoans);
        }
      } catch (e) {
        console.warn('On-chain loan fetch failed, using local:', e);
      }
    }
  }, [address, updateLockedBalance, isRealWallet]);

  useEffect(() => { loadLoans(); }, [loadLoans]);

  // Check contract availability on mount
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

  const handleRepay = async (loanId) => {
    try {
      // Try on-chain first
      if (isRealWallet && chainStatus === 'online') {
        setTxPending('Repaying loan on-chain...');
        try {
          await repayLoanOnChain(address, loanId);
          setTxPending(null);
          loadLoans();
          return;
        } catch (e) {
          console.warn('On-chain repay failed, falling back:', e);
          setTxPending(null);
        }
      }
      // Fallback: local
      repayLoan(loanId);
      loadLoans();
    } catch (err) {
      setTxPending(null);
      alert(err.message);
    }
  };

  const handleCancel = async (loanId) => {
    try {
      // Try on-chain first
      if (isRealWallet && chainStatus === 'online') {
        setTxPending('Cancelling loan on-chain...');
        try {
          await cancelLoanOnChain(address, loanId);
          setTxPending(null);
          loadLoans();
          return;
        } catch (e) {
          console.warn('On-chain cancel failed, falling back:', e);
          setTxPending(null);
        }
      }
      // Fallback: local
      cancelLoan(loanId);
      loadLoans();
    } catch (err) {
      setTxPending(null);
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
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Lock BTC as collateral and borrow USDT
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
          <button className="btn btn-primary btn-lg" onClick={() => setShowCreateModal(true)}>
            <span>+</span> New Loan Request
          </button>
        </div>

        {/* On-chain contract info */}
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

        {/* Pending tx overlay */}
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
            <span className="spinner" style={{ animation: 'pulse 1s infinite' }}>⟳</span> {txPending}
          </div>
        )}

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
                      <button className="btn btn-success btn-sm" onClick={() => handleRepay(loan.id)} disabled={!!txPending}>
                        💳 Repay
                      </button>
                    )}
                    {loan.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(loan.id)} disabled={!!txPending}>
                        ✕ Cancel
                      </button>
                    )}
                    {loan.onChain && (
                      <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>⛓️</span>
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
            chainStatus={chainStatus}
          />
        )}
      </div>
    </div>
  );
}
