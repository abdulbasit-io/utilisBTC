export default function HowItWorks() {
  const borrowerSteps = [
    { icon: '🔐', title: 'Lock BTC', desc: 'Deposit your Bitcoin as collateral into the smart contract. Your BTC stays locked and secure.' },
    { icon: '💵', title: 'Borrow USDT', desc: 'A lender funds your request with USDT. You get the stablecoins while keeping your BTC position.' },
    { icon: '🔓', title: 'Repay & Unlock', desc: 'Pay back the USDT + interest before the deadline. Your Bitcoin collateral is released back to you.' },
  ];

  const lenderSteps = [
    { icon: '🔍', title: 'Browse Requests', desc: 'See loan requests from borrowers with BTC locked as collateral. Evaluate risk and returns.' },
    { icon: '💰', title: 'Fund a Loan', desc: 'Supply USDT to fund a loan. The borrower\'s BTC collateral protects your investment.' },
    { icon: '📈', title: 'Earn Interest', desc: 'Get your USDT back with interest when the borrower repays. If they default, you claim their BTC.' },
  ];

  return (
    <section className="section" style={{ background: 'var(--gradient-hero)' }}>
      <div className="container">
        <div className="section-header">
          <p className="section-label">How It Works</p>
          <h2 className="section-title">Two sides. One protocol.</h2>
          <p className="section-subtitle">
            Whether you need liquidity or want to earn yield — HodlLend has you covered.
          </p>
        </div>

        {/* Borrowers */}
        <div style={{ marginBottom: 'var(--space-16)' }}>
          <h3 style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            marginBottom: 'var(--space-8)',
            color: 'var(--color-accent)',
          }}>
            🏦 For Borrowers
          </h3>
          <div className="steps-grid">
            {borrowerSteps.map((step, i) => (
              <div key={i} className="glass-card step-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lenders */}
        <div>
          <h3 style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            marginBottom: 'var(--space-8)',
            color: 'var(--color-success)',
          }}>
            💰 For Lenders
          </h3>
          <div className="steps-grid">
            {lenderSteps.map((step, i) => (
              <div key={i} className="glass-card step-card animate-slide-up" style={{ animationDelay: `${(i + 3) * 100}ms` }}>
                <div className="step-number" style={{
                  background: 'var(--color-success-bg)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  color: 'var(--color-success)',
                }}>{i + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
