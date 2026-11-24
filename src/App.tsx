import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import { ContractBanner } from './components/ui/EmptyState';
import Home from './pages/Home';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import CreateCampaign from './pages/CreateCampaign';
import Dashboard from './pages/Dashboard';
import Milestones from './pages/Milestones';
import Transparency from './pages/Transparency';
import Refunds from './pages/Refunds';

function Layout() {
  const { pathname, hash } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [pathname, hash]);
  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Navbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <ContractBanner />
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="glass mx-auto mt-10 max-w-lg p-10 text-center">
      <h1 className="text-3xl font-bold text-slate-800">404</h1>
      <p className="mt-2 text-slate-500">This page does not exist.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignDetails />} />
        <Route path="/campaigns/:id/milestones" element={<Milestones />} />
        <Route path="/create" element={<CreateCampaign />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transparency" element={<Transparency />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
