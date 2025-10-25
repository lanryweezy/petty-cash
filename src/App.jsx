import React, { useState, useEffect, createContext, Suspense, lazy } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import { login, initializeData } from './data/models.jsx';

// Lazy load the page components
const Dashboard = lazy(() => import('./components/Dashboard.jsx'));
const RequestForm = lazy(() => import('./components/RequestForm.jsx'));
const ApprovalsDashboard = lazy(() => import('./components/ApprovalsDashboard.jsx'));
const ReceiptUpload = lazy(() => import('./components/ReceiptUpload.jsx'));
const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'));
const SMTPConfig = lazy(() => import('./components/SMTPConfig.jsx'));
const Login = lazy(() => import('./components/auth/Login.jsx'));
const ChangePassword = lazy(() => import('./components/auth/ChangePassword.jsx'));
const Logs = lazy(() => import('./components/Logs.jsx'));
const Reports = lazy(() => import('./components/Reports.jsx'));
const Currencies = lazy(() => import('./components/Currencies.jsx'));
const Roles = lazy(() => import('./components/Roles.jsx'));

// Create contexts for authentication and navigation
export const AuthContext = createContext(null);
export const NavigationContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    initializeData();
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, we'd verify the token with the backend
      // For now, just assume it's valid
      setUser({ token });
    }
  }, []);

  const handleLogin = async (email, password) => {
    const { token } = await login(email, password);
    localStorage.setItem('token', token);
    setUser({ token });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActivePage('dashboard');
  };

  // Render the appropriate component based on active page
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'request':
        return <RequestForm />;
      case 'approvals':
        return <ApprovalsDashboard />;
      case 'receipts':
        return <ReceiptUpload />;
      case 'admin':
        return <AdminPanel />;
      case 'smtp':
        return <SMTPConfig />;
      case 'change-password':
        return <ChangePassword />;
      case 'logs':
        return <Logs />;
      case 'reports':
        return <Reports />;
      case 'currencies':
        return <Currencies />;
      case 'roles':
        return <Roles />;
      default:
        return <Dashboard />;
    }
  };

  // If no user is logged in, show login screen
  if (!user) {
    return <Suspense fallback={<div>Loading...</div>}><Login onLogin={handleLogin} /></Suspense>;
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      <NavigationContext.Provider value={{ activePage, setActivePage }}>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6 overflow-auto">
              <Suspense fallback={<div>Loading...</div>}>
                {renderActivePage()}
              </Suspense>
            </main>
          </div>
        </div>
      </NavigationContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
