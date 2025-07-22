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
import { initializeData, getUsers } from './data/models';

// Create contexts for authentication and navigation
export const AuthContext = createContext(null);
export const NavigationContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize data on first load
    initializeData();
    setIsInitialized(true);
    
    // Auto-login as admin for demo purposes
    const adminUser = getUsers().find(u => u.role === 'admin');
    if (adminUser) {
      setUser(adminUser);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
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
      default:
        return <Dashboard />;
    }
  };

  // If not initialized yet, show loading
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Loading Petty Cash System...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, show login screen
  if (!user) {
    return <Login onLogin={setUser} />;
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