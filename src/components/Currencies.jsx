import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';

const Currencies = () => {
  const { user } = useContext(AuthContext);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Mock currency data - in a real app, this would come from an API
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Currency Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Currency</h2>
          <div className="border-l-4 border-blue-400 bg-blue-50 p-4 mb-4">
            <p className="text-blue-700">
              <strong>Note:</strong> Currency settings are currently handled via environment variables and application configuration.
              This interface is for future multi-currency support.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currencies.map((currency) => (
            <div
              key={currency.code}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedCurrency === currency.code
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedCurrency(currency.code)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{currency.code}</h3>
                  <p className="text-sm text-gray-500">{currency.name}</p>
                </div>
                <div className="text-2xl font-bold text-gray-700">
                  {currency.symbol}
                </div>
              </div>
              {selectedCurrency === currency.code && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Selected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Currency</label>
                <p className="mt-1 text-sm text-gray-900">US Dollar (USD)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Symbol</label>
                <p className="mt-1 text-sm text-gray-900">$</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Decimal Places</label>
                <p className="mt-1 text-sm text-gray-900">2</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Format</label>
                <p className="mt-1 text-sm text-gray-900">$1,234.56</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Features</h3>
          <div className="border-l-4 border-green-400 bg-green-50 p-4">
            <ul className="text-green-700 space-y-1">
              <li>• Multi-currency support for international operations</li>
              <li>• Real-time exchange rate integration</li>
              <li>• Currency conversion for receipts and requests</li>
              <li>• Regional currency defaults by user location</li>
              <li>• Historical exchange rate tracking</li>
              <li>• Custom currency formatting rules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Currencies;