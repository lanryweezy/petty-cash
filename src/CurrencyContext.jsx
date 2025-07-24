import React, { createContext, useState, useEffect } from 'react';
import { getCurrencies } from './data/models.jsx';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(null);

  useEffect(() => {
    const fetchCurrency = async () => {
      const currencies = await getCurrencies();
      const defaultCurrency = currencies.find(c => c.is_default);
      setCurrency(defaultCurrency);
    };
    fetchCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
