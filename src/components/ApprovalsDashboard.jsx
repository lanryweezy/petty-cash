import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { getRequests, saveRequest, getUsers, sendEmailNotification } from '../data/models';

const ApprovalsDashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [users, setUsers] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Load all requests and users
    const loadData = () => {
      const allRequests = getRequests();
      setRequests(allRequests);
      
      // Create a map of user IDs to user objects for easy lookup
      const allUsers = getUsers();
      const usersMap = {};
      allUsers.forEach(user => {
        usersMap[user.id] = user;
      });
      setUsers(usersMap);
      
      // Apply filter
      filterRequests(allRequests, filter);
    };
    
    loadData();
  }, [filter]);
  
  // Filter requests based on status
  const filterRequests = (requestsToFilter, filterStatus) => {
    if (filterStatus === 'all') {
      setFilteredRequests(requestsToFilter);
    } else {
      setFilteredRequests(requestsToFilter.filter(r => r.status === filterStatus));
    }
  };
  
  // Handle approval/rejection of a request
  const handleApprovalAction = (requestId, action) => {
    try {
      // Find the request
      const requestToUpdate = requests.find(r => r.id === requestId);
      if (!requestToUpdate) {
        setErrorMessage('Request not found');
        return;
      }
      
      // Update request status
      requestToUpdate.status = action === 'approve' ? 'approved' : 'rejected';
      requestToUpdate.approvedBy = user.id;
      requestToUpdate.approvedAt = new Date().toISOString();
      
      // Save the updated request
      saveRequest(requestToUpdate);
      
      // Send email notification to requester
      const requester = users[requestToUpdate.userId];
      if (requester) {
        sendEmailNotification(
          requester.email,
          `Your Petty Cash Request has been ${requestToUpdate.status}`,
          `Your petty cash request for $${requestToUpdate.amount.toFixed(2)} (${requestToUpdate.purpose}) has been ${requestToUpdate.status} by ${user.name}.
           
${action === 'approve' ? 'You may now collect the cash from the cashier. Please remember to upload the receipt after your purchase.' : 'If you have any questions, please contact the approver directly.'}`
        );
      }
      
      // Show success message
      setSuccessMessage(`Request has been ${requestToUpdate.status} successfully`);
      
      // Refresh the data
      const updatedRequests = getRequests();
      setRequests(updatedRequests);
      filterRequests(updatedRequests, filter);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Approvals Dashboard</h1>
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Cash Requests</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  filter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  filter === 'approved' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  filter === 'rejected' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
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
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length > 0 ? (
                filteredRequests
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {users[request.userId]?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate">{request.purpose}</div>
                        {request.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {request.description}
                          </div>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprovalAction(request.id, 'approve')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprovalAction(request.id, 'reject')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span>
                            {request.approvedBy ? `By ${users[request.approvedBy]?.name || 'Unknown'}` : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No {filter !== 'all' ? filter : ''} requests found
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

export default ApprovalsDashboard;