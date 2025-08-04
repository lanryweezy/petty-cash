import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'settings', name: 'Settings' },
    { id: 'logs', name: 'System Logs' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900">Quick Actions</h3>
                <p className="text-sm text-blue-700 mt-2">
                  Use the sidebar to navigate to specific admin functions:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• User Management - Add/edit users</li>
                  <li>• SMTP Config - Email settings</li>
                  <li>• Change Password - Update your password</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900">User Roles</h3>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• <strong>Admin</strong> - Full system access</li>
                  <li>• <strong>Approver</strong> - Can approve requests</li>
                  <li>• <strong>User</strong> - Can create requests</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-900">Security</h3>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• JWT token authentication</li>
                  <li>• Role-based access control</li>
                  <li>• Forced password change on first login</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">System Settings</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
              <p className="text-blue-700">
                <strong>Note:</strong> Advanced system settings have been moved to dedicated pages:
              </p>
              <ul className="text-blue-700 mt-2 space-y-1">
                <li>• <strong>User Management</strong> - Add, edit, and manage users</li>
                <li>• <strong>SMTP Config</strong> - Configure email settings</li>
                <li>• <strong>Database settings</strong> - Configure via environment variables</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">System Logs</h2>
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-yellow-700">
              <strong>Coming Soon:</strong> System logs will be available in a future update.
              For now, check server logs for debugging information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;