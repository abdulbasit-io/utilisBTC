import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { LINKS } from '../utils/constants';

export default function CTASection() {
  const { isConnected, connect, isConnecting } = useWallet();

  return (
    <section className="section" style={{
      textAlign: 'center',
      paddingTop: 'var(--space-16)',
      paddingBottom: 'var(--space-16)',
    }}>
      <div className="container">
        <div className="glass-card animate-slide-up" style={{
          padding: 'var(--space-12) var(--space-8)',
          maxWidth: '720px',
          margin: '0 auto',
          borderTop: '3px solid var(--color-accent)',
          borderBottom: '3px solid var(--color-accent)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at center, rgba(247,147,26,0.04) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 800,
            marginBottom: 'var(--space-4)',
            color: 'var(--color-text-primary)',
            position: 'relative',
          }}>
            Ready to put your <span className="highlight">Bitcoin</span> to work?
          </h2>

          <p style={{
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-8)',
            maxWidth: '540px',
            margin: '0 auto var(--space-8)',
            lineHeight: '1.6',
            position: 'relative',
          }}>
            Join the first generation of Bitcoin DeFi on Layer 1. 
            No wrapped tokens. No bridges. Just Bitcoin doing what Bitcoin does best.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
            position: 'relative',
          }}>
            {isConnected ? (
              <>
                <Link to="/borrow" className="btn btn-primary btn-lg">
                  <span>🏦</span> Start Borrowing
                </Link>
                <Link to="/lend" className="btn btn-secondary btn-lg">
                  <span>💰</span> Start Lending
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="btn btn-primary btn-lg"
                >
                  <span>🔗</span> {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
                <a 
                  href={LINKS.OPWALLET} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-lg"
                >
                  <span>📥</span> Get OPWallet
                </a>
              </>
            )}
          </div>

          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--space-6)',
            position: 'relative',
          }}>
            Built on <a href={LINKS.OPNET} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>OP_NET</a> · 
            Open-source on <a href={LINKS.GITHUB} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>GitHub</a>
          </p>
        </div>
      </div>
    </section>
  );
}
