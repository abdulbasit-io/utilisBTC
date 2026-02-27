import { getPlatformStats, getBTCPrice } from '../utils/lendingEngine';
import { formatBTC, formatUSD, formatCompact } from '../utils/formatters';

export default function Stats() {
  const stats = getPlatformStats();
  const btcPrice = getBTCPrice();

  const items = [
    {
      label: 'Total Value Locked',
      value: formatBTC(stats.totalValueLocked),
      subtext: formatUSD(stats.totalValueLocked * btcPrice),
      icon: '🔒',
    },
    {
      label: 'Active Loans',
      value: stats.totalLoansIssued,
      subtext: 'Across all markets',
      icon: '📊',
    },
    {
      label: 'Interest Earned',
      value: `${formatCompact(stats.totalInterestEarned)} USDT`,
      subtext: 'Total platform earnings',
      icon: '💎',
    },
    {
      label: 'BTC Price',
      value: formatUSD(btcPrice),
      subtext: 'Mock Oracle Feed',
      icon: '📡',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <p className="section-label">Platform Stats</p>
          <h2 className="section-title">Trustless lending in numbers</h2>
        </div>

        <div className="stats-grid">
          {items.map((item, i) => (
            <div key={i} className="glass-card stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-3)' }}>{item.icon}</div>
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{item.value}</div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--space-1)',
              }}>
                {item.subtext}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
