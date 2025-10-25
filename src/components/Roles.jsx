import React, { useState, useEffect } from 'react';
import { getRoles } from '../data/models';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const roles = await getRoles();
    setRoles(roles);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
  };

  const handleCancel = () => {
    setEditingRole(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // try {
    //   await saveRole(editingRole);
    //   setSuccess('Role saved successfully!');
    //   setEditingRole(null);
    //   fetchRoles();
    // } catch (err) {
    //   setError(err.message);
    // }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    // const { name } = e.target.elements;
    // try {
    //   await saveRole({ name: name.value });
    //   setSuccess('Role added successfully!');
    //   fetchRoles();
    //   e.target.reset();
    // } catch (err) {
    //   setError(err.message);
    // }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Roles</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Add Role</h3>
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Role Name"
              className="border p-2"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Role
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Manage Roles</h3>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Permissions</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="border px-4 py-2">{role.name}</td>
                <td className="border px-4 py-2">
                  {role.role_permissions.map(p => p.permission).join(', ')}
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold">Edit Role</h3>
            <form onSubmit={handleSave}>
              <div className="my-4">
                <label>Name</label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) =>
                    setEditingRole({
                      ...editingRole,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border"
                />
              </div>
              <div className="my-4">
                <label>Permissions</label>
                <input
                  type="text"
                  value={editingRole.role_permissions.map(p => p.permission).join(', ')}
                  onChange={(e) =>
                    setEditingRole({
                      ...editingRole,
                      role_permissions: e.target.value.split(',').map(p => ({ permission: p.trim() })),
                    })
                  }
                  className="w-full p-2 border"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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

export default Roles;
