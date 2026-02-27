import { Link, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'navbar-link active' : 'navbar-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">₿</div>
          <span>utilisBTC</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/borrow" className={isActive('/borrow')}>Borrow</Link>
          <Link to="/lend" className={isActive('/lend')}>Lend</Link>
        </div>

        <div className="navbar-actions">
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
