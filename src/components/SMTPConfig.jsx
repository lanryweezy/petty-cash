import React, { useState, useEffect } from 'react';
import { getSmtpConfig, saveSmtpConfig, sendEmailNotification } from '../data/models';

const SMTPConfig = () => {
  const [config, setConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: 'Petty Cash System'
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Load existing SMTP configuration
    const savedConfig = getSmtpConfig();
    setConfig(savedConfig);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!config.host.trim()) {
        throw new Error('SMTP Host is required');
      }
      
      if (!config.port || isNaN(parseInt(config.port)) || parseInt(config.port) <= 0) {
        throw new Error('Valid SMTP Port is required');
      }
      
      if (!config.user.trim()) {
        throw new Error('Username is required');
      }
      
      if (!config.fromEmail.trim()) {
        throw new Error('From Email is required');
      }
      
      // Save configuration
      saveSmtpConfig({
        ...config,
        port: parseInt(config.port)
      });
      
      // Show success message
      setSuccessMessage('SMTP configuration saved successfully');
      
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

  const handleTestEmail = () => {
    try {
      // Validate email address
      if (!testEmailAddress.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmailAddress)) {
        throw new Error('Please enter a valid email address');
      }
      
      setIsTesting(true);
      
      // Simulate sending test email
      const result = sendEmailNotification(
        testEmailAddress,
        'Petty Cash System - Test Email',
        `This is a test email from the Petty Cash System.
        
If you received this email, your SMTP configuration is working correctly.

Configuration:
Host: ${config.host}
Port: ${config.port}
Secure: ${config.secure ? 'Yes' : 'No'}
Username: ${config.user}
From Email: ${config.fromEmail}
From Name: ${config.fromName}

Thank you for using the Petty Cash System!`
      );
      
      if (result) {
        setSuccessMessage('Test email sent successfully! Check your inbox.');
      } else {
        setErrorMessage('SMTP not configured properly. Please check your settings.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsTesting(false);
      
      // Clear messages after a delay
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Email Configuration</h1>
      
      <div className="text-sm text-gray-600 mb-6">
        <p>
          Configure the email server settings to enable email notifications for petty cash requests, 
          approvals, and receipt reminders.
        </p>
        <p className="mt-2">
          <strong>Note:</strong> In this demo application, email sending is simulated. 
          In a production environment, you would need to connect to a real SMTP server.
        </p>
      </div>
      
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="host">
                SMTP Host
              </label>
              <input
                type="text"
                id="host"
                name="host"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="smtp.example.com"
                value={config.host}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="port">
                SMTP Port
              </label>
              <input
                type="number"
                id="port"
                name="port"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="587"
                value={config.port}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="user">
                Username
              </label>
              <input
                type="text"
                id="user"
                name="user"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="username@example.com"
                value={config.user}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="••••••••"
                value={config.password}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="fromEmail">
                From Email
              </label>
              <input
                type="email"
                id="fromEmail"
                name="fromEmail"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="pettycash@example.com"
                value={config.fromEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="fromName">
                From Name
              </label>
              <input
                type="text"
                id="fromName"
                name="fromName"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Petty Cash System"
                value={config.fromName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="secure"
                  name="secure"
                  type="checkbox"
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={config.secure}
                  onChange={handleInputChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="secure" className="font-medium text-gray-700">
                  Use SSL/TLS
                </label>
                <p className="text-gray-500">Enable secure connection for email sending.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Configuration
            </button>
          </div>
        </form>
        
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Email Configuration</h3>
          <div className="flex items-center">
            <input
              type="email"
              placeholder="Enter email address"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md mr-4"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
            />
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={isTesting || !config.host}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isTesting ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg mt-8 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Email Notification Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notifyRequests"
                type="checkbox"
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                defaultChecked
                disabled
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="notifyRequests" className="font-medium text-gray-700">
                New request notifications
              </label>
              <p className="text-gray-500">Send email notifications to approvers when a new cash request is submitted.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notifyApprovals"
                type="checkbox"
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                defaultChecked
                disabled
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="notifyApprovals" className="font-medium text-gray-700">
                Approval notifications
              </label>
              <p className="text-gray-500">Send email notifications to requesters when their cash request is approved or rejected.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notifyReceipts"
                type="checkbox"
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                defaultChecked
                disabled
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="notifyReceipts" className="font-medium text-gray-700">
                Receipt reminders
              </label>
              <p className="text-gray-500">Send email reminders to users for pending receipt uploads after approval.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Note: These settings are enabled by default in this demo application.</p>
        </div>
      </div>
    </div>
  );
};

export default SMTPConfig;