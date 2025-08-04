import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [activeReport, setActiveReport] = useState('overview');

  const reports = [
    { id: 'overview', name: 'Overview', description: 'General system statistics' },
    { id: 'requests', name: 'Requests Report', description: 'Petty cash request analytics' },
    { id: 'approvals', name: 'Approvals Report', description: 'Approval workflow analytics' },
    { id: 'users', name: 'User Activity', description: 'User engagement metrics' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      
      {/* Report Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              activeReport === report.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h3 className="font-medium text-gray-900">{report.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeReport === 'overview' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">System Overview</h2>
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
              <p className="text-blue-700">
                <strong>Coming Soon:</strong> Advanced reporting features are in development.
                Current data will be available through API endpoints once the reporting system is complete.
              </p>
            </div>
          </div>
        )}

        {activeReport === 'requests' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Requests Report</h2>
            <div className="border-l-4 border-green-400 bg-green-50 p-4">
              <p className="text-green-700">
                <strong>Planned Features:</strong>
              </p>
              <ul className="text-green-700 mt-2 space-y-1">
                <li>• Total requests by period</li>
                <li>• Average request amounts</li>
                <li>• Request status breakdown</li>
                <li>• Department/user analytics</li>
              </ul>
            </div>
          </div>
        )}

        {activeReport === 'approvals' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Approvals Report</h2>
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <p className="text-yellow-700">
                <strong>Planned Features:</strong>
              </p>
              <ul className="text-yellow-700 mt-2 space-y-1">
                <li>• Approval response times</li>
                <li>• Approver workload distribution</li>
                <li>• Approval vs rejection rates</li>
                <li>• Escalation patterns</li>
              </ul>
            </div>
          </div>
        )}

        {activeReport === 'users' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">User Activity Report</h2>
            <div className="border-l-4 border-purple-400 bg-purple-50 p-4">
              <p className="text-purple-700">
                <strong>Planned Features:</strong>
              </p>
              <ul className="text-purple-700 mt-2 space-y-1">
                <li>• User login frequency</li>
                <li>• Most active users</li>
                <li>• Feature usage statistics</li>
                <li>• Role-based activity metrics</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;