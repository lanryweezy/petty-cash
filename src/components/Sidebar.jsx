import React, { useContext } from 'react';
import { AuthContext, NavigationContext } from '../App.jsx';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const { activePage, setActivePage } = useContext(NavigationContext);

  // Define navigation items based on user role
  const getNavItems = () => {
    const items = [
      {
        name: 'Dashboard',
        id: 'dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        permission: 'dashboard.read'
      },
      {
        name: 'New Request',
        id: 'request',
        icon: 'M12 4v16m8-8H4',
        permission: 'requests.create'
      },
      {
        name: 'Approvals',
        id: 'approvals',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        permission: 'approvals.read'
      },
      {
        name: 'Receipts',
        id: 'receipts',
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        permission: 'receipts.read'
      },
      {
        name: 'Admin Panel',
        id: 'admin',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        permission: 'admin.read'
      },
      {
        name: 'SMTP Config',
        id: 'smtp',
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        permission: 'admin.read'
      },
      {
        name: 'Change Password',
        id: 'change-password',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        permission: 'password.update'
      },
      {
        name: 'Logs',
        id: 'logs',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        permission: 'logs.read'
      },
      {
        name: 'Reports',
        id: 'reports',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        permission: 'reports.read'
      },
      {
        name: 'Currencies',
        id: 'currencies',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-2a9 9 0 100 18 9 9 0 000-18z',
        permission: 'currencies.read'
      },
      {
        name: 'Roles',
        id: 'roles',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2',
        permission: 'roles.read'
      }
    ];
    
    const userPermissions = user.roles.role_permissions.map(p => p.permission);
    return items.filter(item => userPermissions.includes(item.permission));
  };

  const navItems = getNavItems();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`${
                    activePage === item.id
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4`}
                >
                  <svg
                    className={`${
                      activePage === item.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <svg
                  className="inline-block h-9 w-9 rounded-full text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user.name}</p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;