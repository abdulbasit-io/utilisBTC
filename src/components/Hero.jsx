import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

export default function Hero() {
  const { isConnected } = useWallet();

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
          Built on Bitcoin Layer 1 · Powered by OP_NET
        </div>

        <h1 className="hero-title">
          <span className="highlight">HODL</span> Your Bitcoin.
          <br />
          Unlock Its <span className="highlight">Value.</span>
        </h1>

        <p className="hero-subtitle">
          Lock BTC as collateral to borrow stablecoins. Or lend your USDT to earn interest — 
          backed by Bitcoin. Peer-to-peer. Trustless. On-chain.
        </p>

        <div className="hero-actions">
          <Link to="/borrow" className="btn btn-primary btn-lg">
            <span>🏦</span> I Want to Borrow
          </Link>
          <Link to="/lend" className="btn btn-secondary btn-lg">
            <span>💰</span> I Want to Lend
          </Link>
        </div>

        {!isConnected && (
          <p style={{
            marginTop: 'var(--space-6)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
          }}>
            Connect your OPWallet to get started →
          </p>
        )}
      </div>
    </section>
  );
}
