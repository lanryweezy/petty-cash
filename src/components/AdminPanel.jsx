import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import pool from '../../db';
import { getApprovalRules, saveApprovalRule, getRoles } from '../data/models';
import bcrypt from 'bcrypt';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Load data
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersData = await pool.query('SELECT * FROM users');
      setUsers(usersData.rows);

      const rolesData = await getRoles();
      setRoles(rolesData);

      const allRules = await getApprovalRules();
      setRules(allRules);

    } catch (error) {
      setErrorMessage(error.message);
    }
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
        await pool.query('UPDATE users SET name = $1, role = $2 WHERE id = $3', [editingUser.name, editingUser.role, editingUser.id]);
        await pool.query('INSERT INTO logs (message, user_id) VALUES ($1, $2)', [`updated user ${editingUser.email}`, user.id]);
        setSuccessMessage(`User ${editingUser.name} updated successfully`);
      } else {
        // Create user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(editingUser.password, salt);
        const { rows } = await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *', [editingUser.name, editingUser.email, hashedPassword, editingUser.role]);
        await pool.query('INSERT INTO logs (message, user_id) VALUES ($1, $2)', [`created user ${rows[0].email}`, user.id]);
        setSuccessMessage(`User ${rows[0].email} created successfully`);
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
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">User Management</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search..."
              className="border p-2 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                  <th className_name="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
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
                      {user.roles?.name}
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
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="role_id">
                    Role
                  </label>
                  <select
                    id="role_id"
                    name="role_id"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={editingUser.role_id}
                    onChange={handleUserChange}
                    required
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
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

  const renderApprovalRulesTab = () => {
    return <div>Approval Rules</div>
  }

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