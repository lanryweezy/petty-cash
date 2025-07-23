import React, { useState, useEffect, createContext } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RequestForm from './components/RequestForm';
import ApprovalsDashboard from './components/ApprovalsDashboard';
import ReceiptUpload from './components/ReceiptUpload';
import AdminPanel from './components/AdminPanel';
import SMTPConfig from './components/SMTPConfig';
import Login from './components/auth/Login';
import ChangePassword from './components/auth/ChangePassword';
import { login, signup } from './data/models';

// Create contexts for authentication and navigation
export const AuthContext = createContext(null);
export const NavigationContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
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
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      <NavigationContext.Provider value={{ activePage, setActivePage }}>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6 overflow-auto">
              {renderActivePage()}
            </main>
          </div>
        </div>
      </NavigationContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;