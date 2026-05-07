import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sessions } from './pages/Sessions';
import { Billing } from './pages/Billing';
import { Customers } from './pages/Customers';
import { Passes } from './pages/Passes';
import { Discounts } from './pages/Discounts';
import { Reports } from './pages/Reports';
import { OffersLayout } from './pages/Offers';

function RequireAuth({ children }: { children: ReactElement }) {
  const token = localStorage.getItem('gc_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const token = localStorage.getItem('gc_token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(localStorage.getItem('gc_user') ?? '{}');
    if (user?.role !== 'admin') return <Navigate to="/" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/billing/:sessionId" element={<Billing />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
          {/* Offers — nested sub-tabs */}
          <Route path="/offers" element={<RequireAdmin><OffersLayout /></RequireAdmin>}>
            <Route path="passes"    element={<Passes />} />
            <Route path="discounts" element={<Discounts />} />
          </Route>
          {/* Legacy redirects in case old links are used */}
          <Route path="/passes"    element={<Navigate to="/offers/passes"    replace />} />
          <Route path="/discounts" element={<Navigate to="/offers/discounts" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
