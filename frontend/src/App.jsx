import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Tracking from './pages/Tracking';
import RouteOptimizer from './pages/RouteOptimizer';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminRestaurants from './pages/AdminRestaurants';
import AdminMenus from './pages/AdminMenus';

function AppContent() {
  const { isAuthenticated, role } = useContext(AppContext);

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        transition: 'background-color 0.3s, color 0.3s'
      }}>
        {/* Main Navigation Header */}
        <Navbar />
        
        {/* Main App Content Views */}
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<Restaurants />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/optimizer" element={<RouteOptimizer />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/menus" element={<AdminMenus />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to={role === 'admin' ? "/admin/dashboard" : "/"} replace />} />
          </Routes>
        </main>

        {/* Persistent Footer */}
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
