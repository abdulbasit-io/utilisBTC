import { Link } from 'react-router-dom';

export default function WhyHodlLend() {
  const features = [
    {
      icon: '💎',
      title: "Don't Sell. Borrow.",
      desc: 'Keep your long-term BTC position. Access cash without giving up your coins.',
      accent: 'var(--color-accent)',
    },
    {
      icon: '🛡️',
      title: 'Overcollateralized',
      desc: 'Every loan backed by 150%+ in real Bitcoin. Not promises — actual BTC.',
      accent: 'var(--color-success)',
    },
    {
      icon: '⛓️',
      title: 'Bitcoin L1 Native',
      desc: "No bridges. No sidechains. Settles directly on Bitcoin through OP_NET.",
      accent: '#60a5fa',
    },
    {
      icon: '🤝',
      title: 'Peer-to-Peer',
      desc: 'Connect with counterparties directly. No intermediary holds your funds.',
      accent: '#c084fc',
    },
    {
      icon: '📊',
      title: 'Earn Real Yield',
      desc: "Lend USDT, earn interest. If borrowers default — you get their BTC.",
      accent: '#fbbf24',
    },
    {
      icon: '🔓',
      title: 'Non-Custodial',
      desc: "Your keys, your Bitcoin. Smart contracts hold collateral, not a company.",
      accent: '#f472b6',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <p className="section-label">Why HodlLend</p>
          <h2 className="section-title">Bitcoin was never meant to sit idle.</h2>
          <p className="section-subtitle">
            Unlock liquidity without giving up ownership.
          </p>
        </div>

        <div className="stats-grid">
          {features.map((item, i) => (
            <div 
              key={i} 
              className="glass-card stat-card animate-slide-up" 
              style={{ 
                animationDelay: `${i * 80}ms`,
                textAlign: 'left',
                padding: 'var(--space-6)',
                borderTop: `3px solid ${item.accent}`,
              }}
            >
              <div style={{ 
                fontSize: '1.75rem', 
                marginBottom: 'var(--space-3)',
              }}>
                {item.icon}
              </div>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
