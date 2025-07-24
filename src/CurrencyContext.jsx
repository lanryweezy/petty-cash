import React, { createContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(null);

  useEffect(() => {
    const fetchCurrency = async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_default', true)
        .single();
      if (error) {
        console.error(error);
      } else {
        setCurrency(data);
      }
    };
    fetchCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency }}>
      {children}
    </CurrencyContext.Provider>
  );
};
