import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';

const Logs = () => {
  const { user } = useContext(AuthContext);
  const [activeFilter, setActiveFilter] = useState('all');

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Logs</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">System Logs Coming Soon</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>System logging functionality is being developed. The following features will be available:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>User authentication events</li>
                  <li>Request creation and approval actions</li>
                  <li>Receipt upload activities</li>
                  <li>Administrative changes</li>
                  <li>System errors and warnings</li>
                  <li>Export capabilities for audit trails</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Temporary Development Info</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>For now, check server logs for debugging:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Server console output for real-time logs</li>
              <li>• Application errors in browser developer tools</li>
              <li>• Network requests in browser Network tab</li>
              <li>• Database logs if available in your hosting environment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
