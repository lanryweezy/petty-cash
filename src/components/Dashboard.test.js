import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { AuthContext } from '../App';
import { CurrencyContext } from '../CurrencyContext';

describe('Dashboard', () => {
  it('renders the dashboard', () => {
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

    expect(screen.getByText('Petty Cash Dashboard')).toBeInTheDocument();
  });
});
