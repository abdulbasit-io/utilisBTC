import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { LINKS } from '../utils/constants';

export default function Hero() {
  const { isConnected, connect, isConnecting } = useWallet();

  return (
    <section className="hero">
      <div className="particles">
        <div className="particle" style={{ left: '5%', top: '15%' }}></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="container hero-content animate-slide-up">
        <div className="hero-badge">
          <span>⚡</span>
          The First Lending Protocol on Bitcoin Layer 1
        </div>

        <h1 className="hero-title">
          Your Bitcoin is <span className="highlight">Worth More</span>
          <br />
          Than Just <span className="highlight">Holding.</span>
        </h1>

        <p className="hero-subtitle">
          Borrow stablecoins against your BTC. Lend USDT and earn yield.<br />
          No banks. No bridges. Just Bitcoin.
        </p>

        <div className="hero-actions">
          <Link to="/borrow" className="btn btn-primary btn-lg">
            <span>🏦</span> Borrow Against My BTC
          </Link>
          <Link to="/lend" className="btn btn-secondary btn-lg">
            <span>💰</span> Earn Yield on USDT
          </Link>
        </div>

        {!isConnected && (
          <div className="hero-cta-secondary">
            <button 
              onClick={connect} 
              disabled={isConnecting}
              className="btn-inline"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                marginTop: 'var(--space-6)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {isConnecting ? '⏳ Connecting...' : '🔗 Connect OPWallet to Get Started →'}
            </button>
          </div>
        )}

        <div className="hero-trust-bar" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-8)',
          marginTop: 'var(--space-10)',
          flexWrap: 'wrap',
        }}>
          {[
            { icon: '🛡️', text: '150% Collateralized' },
            { icon: '⛓️', text: 'On-Chain Settlement' },
            { icon: '🔒', text: 'Non-Custodial' },
            { icon: '₿', text: 'Bitcoin Native' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              opacity: 0.8,
            }}>
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
