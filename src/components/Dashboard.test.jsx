import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard.jsx';
import { AuthContext } from '../App.jsx';
import { CurrencyContext } from '../CurrencyContext.jsx';

describe('Dashboard', () => {
  it('renders the dashboard', async () => {
    const user = {
      name: 'Test User',
      role: 'admin',
      roles: {
        role_permissions: [
          { permission: 'dashboard.read' },
        ],
      },
    };
    const currency = {
      symbol: '$',
    };

    render(
      <AuthContext.Provider value={{ user }}>
        <CurrencyContext.Provider value={{ currency }}>
          <Dashboard />
        </CurrencyContext.Provider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Petty Cash Dashboard')).toBeInTheDocument();
    });
  });
});
