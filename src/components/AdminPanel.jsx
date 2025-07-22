import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../../supabaseClient';
import { getApprovalRules, saveApprovalRule } from '../data/models';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Load data
    loadData();
  }, []);

  const loadData = async () => {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
      setErrorMessage(error.message);
    } else {
      setUsers(users);
    }

    const allRules = getApprovalRules();
    setRules(allRules);
  };

  // Handle user form
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setEditingUser({
      ...editingUser,
      [name]: value,
    });
  };

  const handleAddUser = () => {
    setEditingUser({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
  };

  const handleEditUser = (userId) => {
    const userToEdit = users.find((u) => u.id === userId);
    if (userToEdit) {
      setEditingUser({ ...userToEdit });
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    try {
      if (editingUser.id) {
        // Update user
        const { error } = await supabase
          .from('users')
          .update({
            name: editingUser.name,
            role: editingUser.role,
          })
          .eq('id', editingUser.id);
        if (error) throw error;
        await supabase.from('logs').insert({ message: `updated user ${editingUser.email}`, user_id: user.id });
        setSuccessMessage(`User ${editingUser.name} updated successfully`);
      } else {
        // Create user
        const { data, error } = await supabase.auth.signUp({
          email: editingUser.email,
          password: editingUser.password,
          options: {
            data: {
              name: editingUser.name,
              role: editingUser.role,
            },
          },
        });
        if (error) throw error;
        await supabase.from('logs').insert({ message: `created user ${data.user.email}`, user_id: user.id });
        setSuccessMessage(`User ${data.user.email} created successfully`);
      }

      // Reset form and refresh data
      setEditingUser(null);
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

  // Handle rule form
  const handleRuleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'isActive') {
      setEditingRule({
        ...editingRule,
        isActive: e.target.checked
      });
    } else if (name === 'approveAll') {
      setEditingRule({
        ...editingRule,
        approveAll: e.target.checked
      });
    } else {
      setEditingRule({
        ...editingRule,
        [name]: value
      });
    }
  };

  const handleAddRule = () => {
    const approvers = users.filter(u => u.role === 'approver');
    
    setEditingRule({
      approverId: approvers.length > 0 ? approvers[0].id : '',
      amountThreshold: 100,
      isActive: true,
      approveAll: false
    });
  };

  const handleEditRule = (ruleId) => {
    const ruleToEdit = rules.find(r => r.id === ruleId);
    if (ruleToEdit) {
      setEditingRule({ ...ruleToEdit });
    }
  };

  const handleSaveRule = (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!editingRule.approverId) {
        throw new Error('Approver is required');
      }
      
      if (!editingRule.approveAll && (!editingRule.amountThreshold || isNaN(parseFloat(editingRule.amountThreshold)) || parseFloat(editingRule.amountThreshold) <= 0)) {
        throw new Error('Valid amount threshold is required');
      }
      
      // Save rule
      const savedRule = saveApprovalRule({
        ...editingRule,
        amountThreshold: parseFloat(editingRule.amountThreshold)
      });
      
      // Show success message
      setSuccessMessage('Approval rule saved successfully');
      
      // Reset form and refresh data
      setEditingRule(null);
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

  // Render user management tab
  const renderUsersTab = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">User Management</h2>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>
        
        {/* User List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'approver' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'cashier' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* User Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser.id ? 'Edit User' : 'Add New User'}
              </h3>
              
              <form onSubmit={handleSaveUser}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Full Name"
                    value={editingUser.name}
                    onChange={handleUserChange}
                    required
                  />
                </div>
                
                {!editingUser.id && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Password"
                      value={editingUser.password}
                      onChange={handleUserChange}
                      required
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Email Address"
                    value={editingUser.email}
                    onChange={handleUserChange}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={editingUser.role}
                    onChange={handleUserChange}
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="approver">Approver</option>
                    <option value="cashier">Cashier</option>
                    <option value="user">Regular User</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettingsTab = () => {
    const [currencies, setCurrencies] = useState([]);
    const [defaultCurrency, setDefaultCurrency] = useState('');

    useEffect(() => {
      const fetchCurrencies = async () => {
        const { data, error } = await supabase.from('currencies').select('*');
        if (error) {
          setErrorMessage(error.message);
        } else {
          setCurrencies(data);
          const defaultCurrency = data.find((c) => c.is_default);
          if (defaultCurrency) {
            setDefaultCurrency(defaultCurrency.id);
          }
        }
      };
      fetchCurrencies();
    }, []);

    const handleSaveSettings = async () => {
      try {
        await supabase
          .from('currencies')
          .update({ is_default: false })
          .eq('is_default', true);
        await supabase
          .from('currencies')
          .update({ is_default: true })
          .eq('id', defaultCurrency);
        setSuccessMessage('Settings saved successfully');
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="defaultCurrency">
            Default Currency
          </label>
          <select
            id="defaultCurrency"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Admin Panel</h1>
      
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
      
      <div className="mb-6">
        <div className="sm:hidden">
          <select
            id="tabs"
            name="tabs"
            className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="users">Users</option>
            <option value="rules">Approval Rules</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'rules'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approval Rules
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'rules' && renderApprovalRulesTab()}
      </div>
    </div>
  );
};

export default AdminPanel;