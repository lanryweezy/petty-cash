import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, NavigationContext } from '../App';
import { saveRequest, sendEmailNotification, getApprovalRules, getUsers } from '../data/models';

const RequestForm = () => {
  const { user } = useContext(AuthContext);
  const { setActivePage } = useContext(NavigationContext);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [approvers, setApprovers] = useState([]);

  useEffect(() => {
    // Get list of approvers for display purposes
    const users = getUsers();
    const approverUsers = users.filter(u => u.role === 'approver');
    setApprovers(approverUsers);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Validate inputs
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (!purpose.trim()) {
        throw new Error('Please enter a purpose for this request');
      }

      // Create request object
      const request = {
        userId: user.id,
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        description: description.trim(),
        requesterName: user.name,
        // Other fields like status, createdAt will be set in the saveRequest function
      };

      // Save the request
      const savedRequest = saveRequest(request);

      // Determine which approvers should be notified based on approval rules
      const rules = getApprovalRules();
      const amountValue = parseFloat(amount);
      let notifiedApprovers = [];

      // Find applicable rules
      rules.forEach(rule => {
        if (rule.isActive) {
          if (rule.approveAll || amountValue <= rule.amountThreshold) {
            const approver = approvers.find(a => a.id === rule.approverId);
            if (approver && !notifiedApprovers.includes(approver.id)) {
              notifiedApprovers.push(approver);
              
              // Send email notification to approver (simulated)
              sendEmailNotification(
                approver.email,
                `New Petty Cash Request: ${purpose}`,
                `A new petty cash request has been submitted:
                 
Requester: ${user.name}
Amount: $${amountValue.toFixed(2)}
Purpose: ${purpose}
Description: ${description}

Please login to the Petty Cash system to approve or reject this request.`
              );
            }
          }
        }
      });

      // Show success message
      setSuccessMessage(`Your request has been submitted successfully. ${notifiedApprovers.length > 0 ? 'Approvers have been notified.' : ''}`);
      
      // Reset form
      setAmount('');
      setPurpose('');
      setDescription('');
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        setActivePage('dashboard');
      }, 3000);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">New Cash Request</h1>
      
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
      
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="amount">
            Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0.01"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="purpose">
            Purpose
          </label>
          <input
            type="text"
            id="purpose"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Brief purpose of this request"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows="3"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Additional details about this request"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Approval Information</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              Your request will be sent for approval based on the amount requested:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {approvers.length > 0 ? (
                approvers.map(approver => (
                  <li key={approver.id}>Amounts approved by: {approver.name}</li>
                ))
              ) : (
                <li>No approvers configured. Your request will be automatically approved.</li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setActivePage('dashboard')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;