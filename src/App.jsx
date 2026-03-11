import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './views/Dashboard';
import InventoryManager from './views/InventoryManager';
import Transactions from './views/Transactions';
import InventoryAudit from './views/InventoryAudit';
import ActiveAudit from './views/ActiveAudit';
import Login from './views/Login';
import ProtectedRoute from './components/ProtectedRoute';

function AuthenticatedLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="main-content">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<InventoryManager />} />
            <Route path="/movimientos" element={<Transactions />} />
            <Route path="/audits" element={<InventoryAudit />} />
            <Route path="/audits/:id" element={<ActiveAudit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
