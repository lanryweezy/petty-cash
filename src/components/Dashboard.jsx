import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';
import StatsCard from './StatsCard';
import { 
  BarChart as RechartsBarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { getRequests, getReceipts } from '../data/models.jsx';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [thisMonthSpent, setThisMonthSpent] = useState(0);
  const [pendingReceipts, setPendingReceipts] = useState(0);
  const [statusData, setStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  
  useEffect(() => {
    // Load data
    const loadData = async () => {
      const allRequests = await getRequests();
      setRequests(allRequests);
      
      // Calculate pending approvals
      const pendingCount = allRequests.filter(r => r.status === 'pending').length;
      setPendingApprovals(pendingCount);
      
      // Calculate this month's spent amount
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const approvedThisMonth = allRequests.filter(
        r => r.status === 'approved' && new Date(r.approved_at) >= startOfMonth
      );
      const totalSpent = approvedThisMonth.reduce((sum, r) => sum + r.amount, 0);
      setThisMonthSpent(totalSpent);
      
      // Calculate pending receipts
      const approvedRequests = allRequests.filter(r => r.status === 'approved');
      const receipts = await getReceipts();
      const pendingReceiptsCount = approvedRequests.filter(
        r => !receipts.some(receipt => receipt.request_id === r.id)
      ).length;
      setPendingReceipts(pendingReceiptsCount);
      
      // Prepare status data for pie chart
      const statusCounts = {
        pending: allRequests.filter(r => r.status === 'pending').length,
        approved: allRequests.filter(r => r.status === 'approved').length,
        rejected: allRequests.filter(r => r.status === 'rejected').length
      };
      
      setStatusData([
        { name: 'Pending', value: statusCounts.pending },
        { name: 'Approved', value: statusCounts.approved },
        { name: 'Rejected', value: statusCounts.rejected }
      ]);
      
      // Prepare monthly data for bar chart
      const last6Months = Array(6).fill().map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          timestamp: new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
        };
      }).reverse();
      
      const monthlySpending = last6Months.map(({ month, timestamp }) => {
        const nextMonth = new Date(new Date(timestamp).setMonth(new Date(timestamp).getMonth() + 1));
        const approved = allRequests.filter(
          r => r.status === 'approved' && new Date(r.approved_at) >= timestamp && new Date(r.approved_at) < nextMonth
        );
        const amount = approved.reduce((sum, r) => sum + r.amount, 0);
        return { month, amount };
      });
      
      setMonthlyData(monthlySpending);
    };
    
    loadData();
  }, []);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Petty Cash Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total Requests"
          value={requests.length}
          change={`+${requests.filter(r => {
            const createdDate = new Date(r.createdAt);
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            return createdDate > lastWeek;
          }).length} new`}
          trend="up"
          icon={{ bgColor: 'bg-blue-500', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }}
        />
        
        <StatsCard 
          title="Pending Amount"
          value={`$${requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}`}
          change={`${pendingApprovals} requests`}
          trend={pendingApprovals > 0 ? 'up' : 'down'}
          icon={{ bgColor: 'bg-yellow-500', path: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }}
        />
        
        <StatsCard 
          title="This Month Spent"
          value={`$${thisMonthSpent.toFixed(2)}`}
          change="Current month"
          trend="up"
          icon={{ bgColor: 'bg-green-500', path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }}
        />
        
        <StatsCard 
          title="Pending Receipts"
          value={pendingReceipts}
          change={pendingReceipts > 0 ? 'Upload needed' : 'All clear'}
          trend={pendingReceipts > 0 ? 'up' : 'down'}
          icon={{ bgColor: 'bg-purple-500', path: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Legend />
                <Bar dataKey="amount" name="Spent Amount" fill="#4f46e5" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Status</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${request.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No requests found
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;