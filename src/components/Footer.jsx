import { LINKS } from '../utils/constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-icon">₿</div>
          <span className="footer-text">
            HodlLend · Built on Bitcoin L1 · Powered by{' '}
            <a href={LINKS.OPNET} target="_blank" rel="noopener noreferrer">OP_NET</a>
          </span>
        </div>

        <div className="footer-links">
          <a href={LINKS.DOCS} target="_blank" rel="noopener noreferrer" className="footer-link">Docs</a>
          <a href={LINKS.GITHUB} target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          <a href={LINKS.DISCORD} target="_blank" rel="noopener noreferrer" className="footer-link">Discord</a>
          <a href={LINKS.TELEGRAM} target="_blank" rel="noopener noreferrer" className="footer-link">Telegram</a>
          <a href={LINKS.TWITTER} target="_blank" rel="noopener noreferrer" className="footer-link">@opnetbtc</a>
        </div>
      </div>
    </footer>
  );
}
