import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Stats from './components/Stats';
import Footer from './components/Footer';
import BorrowerDashboard from './components/BorrowerDashboard';
import LenderDashboard from './components/LenderDashboard';

function LandingPage() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Navbar />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/borrow" element={<BorrowerDashboard />} />
            <Route path="/lend" element={<LenderDashboard />} />
          </Routes>
        </main>
        <Footer />
      </WalletProvider>
    </BrowserRouter>
  );
}
