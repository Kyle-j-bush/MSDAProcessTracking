import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { OfflineBanner } from './components/OfflineBanner';
import { Hammer, LayoutDashboard, History, Loader2 } from 'lucide-react';

// Lazy load components
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const TimeTracker = React.lazy(() => import('./components/TimeTracker').then(module => ({ default: module.TimeTracker })));

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen text-blue-600">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

function Nav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-primary bg-purple-50' : 'text-gray-500 hover:text-gray-700';

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center p-3">
        <Link to="/" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/')}`}>
          <Hammer className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Tracker</span>
        </Link>
        <Link to="/admin" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/admin')}`}>
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Admin</span>
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-dvh bg-gray-100 text-gray-900 font-sans pb-32">
        <OfflineBanner />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<TimeTracker />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
        <Nav />
        {/* Version Label */}
        <span className="fixed bottom-16 right-4 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded shadow">V0.2</span>
      </div>
    </Router>
  );
}

export default App;
