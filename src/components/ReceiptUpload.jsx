import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { CurrencyContext } from '../CurrencyContext.jsx';
import { getRequests, getReceipts, saveReceipt, sendEmailNotification, getUsers } from '../data/models';
import pool from '../db';

const ReceiptUpload = () => {
  const { user } = useContext(AuthContext);
  const { currency } = useContext(CurrencyContext);
  const [requests, setRequests] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptData, setReceiptData] = useState({
    amount: '',
    merchant: '',
    notes: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    // Load all approved requests that need receipts
    const allRequests = await getRequests();
    const allReceipts = await getReceipts();
    setReceipts(allReceipts);
    
    // Filter requests based on user role and receipt status
    let filteredRequests;
    if (user.roles.name === 'admin' || user.roles.name === 'cashier') {
      // Admins and cashiers can see all approved requests
      filteredRequests = allRequests.filter(r => r.status === 'approved');
    } else {
      // Regular users can only see their own approved requests
      filteredRequests = allRequests.filter(r => 
        r.status === 'approved' && r.user_id === user.id
      );
    }
    
    // Filter out requests that already have receipts
    const requestsNeedingReceipts = filteredRequests.filter(request => 
      !allReceipts.some(receipt => receipt.request_id === request.id)
    );
    
    setRequests(requestsNeedingReceipts);
    setPendingReceipts(requestsNeedingReceipts);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrorMessage('File size exceeds the 5MB limit.');
        e.target.value = null;
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Invalid file type. Please upload a JPG, PNG, or PDF file.');
        e.target.value = null;
        return;
      }

      setReceiptFile(file);
      
      // In a real app, we might use OCR to extract information
      // For now, just simulate by prefilling the amount from the request
      if (selectedRequestId) {
        const selectedRequest = requests.find(r => r.id === selectedRequestId);
        if (selectedRequest) {
          setReceiptData({
            ...receiptData,
            amount: selectedRequest.amount.toFixed(2)
          });
        }
      }
    }
  };

  const handleRequestChange = (e) => {
    const requestId = e.target.value;
    setSelectedRequestId(requestId);
    
    if (requestId) {
      const selectedRequest = requests.find(r => r.id === requestId);
      if (selectedRequest) {
        setReceiptData({
          ...receiptData,
          amount: selectedRequest.amount.toFixed(2)
        });
      }
    } else {
      setReceiptData({
        amount: '',
        merchant: '',
        notes: ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceiptData({
      ...receiptData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!selectedRequestId) {
        throw new Error('Please select a request');
      }
      
      if (!receiptFile) {
        throw new Error('Please upload a receipt file');
      }
      
      if (!receiptData.amount || isNaN(parseFloat(receiptData.amount)) || parseFloat(receiptData.amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      if (!receiptData.merchant.trim()) {
        throw new Error('Please enter a merchant name');
      }
      
      // Upload file to the server
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      const uploadResponse = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }
      const uploadData = await uploadResponse.json();

      // Save receipt metadata to the database
      await pool.query(
        'INSERT INTO receipts (request_id, file_path, amount, merchant, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          selectedRequestId,
          uploadData.filePath,
          parseFloat(receiptData.amount),
          receiptData.merchant.trim(),
          receiptData.notes.trim(),
          user.id,
        ]
      );
      
      // Notify relevant parties
      const selectedRequest = requests.find(r => r.id === selectedRequestId);
      const users = await getUsers();
      const approver = users.find(u => u.id === selectedRequest?.approved_by);
      
      if (approver) {
        await sendEmailNotification(
          approver.email,
          'Receipt Uploaded for Approved Request',
          `A receipt has been uploaded for the approved request:\n\nRequest: ${selectedRequest.purpose}\nAmount Requested: ${currency?.symbol}${selectedRequest.amount.toFixed(2)}\nReceipt Amount: ${currency?.symbol}${parseFloat(receiptData.amount).toFixed(2)}\nMerchant: ${receiptData.merchant}\nUploaded by: ${user.name}\n\n${receiptData.notes ? `Notes: ${receiptData.notes}` : ''}`
        );
      }
      
      // Show success message and reset form
      setSuccessMessage('Receipt uploaded successfully');
      setSelectedRequestId('');
      setReceiptFile(null);
      setReceiptData({
        amount: '',
        merchant: '',
        notes: ''
      });
      
      // Refresh the data
      loadData();
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setErrorMessage(error.message);
      
      // Clear error message after a delay
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };
  
  // Display filesize in a human-readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const [userReceipts, setUserReceipts] = useState([]);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const { rows } = await pool.query(
          `
          SELECT receipts.*, requests.purpose, requests.amount AS request_amount
          FROM receipts
          JOIN requests ON receipts.request_id = requests.id
          WHERE receipts.user_id = $1
          ORDER BY receipts.created_at DESC
        `,
          [user.id]
        );
        setUserReceipts(rows);
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    fetchReceipts();
  }, [user, searchTerm]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Receipt Management</h1>
      
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Receipt</h2>
          
          {pendingReceipts.length === 0 ? (
            <div className="text-center py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending receipts</h3>
              <p className="mt-1 text-sm text-gray-500">
                All approved requests have receipts uploaded.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="request">
                  Select Request
                </label>
                <select
                  id="request"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={selectedRequestId}
                  onChange={handleRequestChange}
                  required
                >
                  <option value="">Select a request</option>
                  {requests.map(request => (
                    <option key={request.id} value={request.id}>
                      {request.purpose} - {currency?.symbol}{request.amount.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="receipt">
                  Receipt File
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col rounded-lg border-2 border-dashed w-full h-32 p-10 group text-center">
                    <div className="h-full w-full text-center flex flex-col items-center justify-center">
                      {!receiptFile ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-gray-500">
                            <span className="text-indigo-600 hover:underline">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 5MB)</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-gray-500">{receiptFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(receiptFile.size)}</p>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,application/pdf"
                    />
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="amount">
                  Receipt Amount ({currency?.symbol})
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{currency?.symbol}</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    value={receiptData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="merchant">
                  Merchant Name
                </label>
                <input
                  type="text"
                  id="merchant"
                  name="merchant"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Store or service provider name"
                  value={receiptData.merchant}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="notes">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Any additional information about this receipt"
                  value={receiptData.notes}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upload Receipt
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Receipts List */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Uploaded Receipts</h2>
            <input
              type="text"
              placeholder="Search..."
              className="border p-2 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {userReceipts.length === 0 ? (
            <div className="text-center py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts uploaded yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by uploading a receipt for an approved request.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Purpose
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userReceipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(receipt.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.requests.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currency?.symbol}{receipt.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a
                          href={receipt.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Receipt
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptUpload;
