import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { CurrencyContext } from '../CurrencyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { currency } = useContext(CurrencyContext);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [spendingByUser, setSpendingByUser] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSpendingByCategory = async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select('*, requests(purpose)')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        const spending = data.reduce((acc, receipt) => {
          const category = receipt.requests.purpose;
          const amount = receipt.amount;
          const existingCategory = acc.find((item) => item.name === category);
          if (existingCategory) {
            existingCategory.amount += amount;
          } else {
            acc.push({ name: category, amount });
          }
          return acc;
        }, []);
        setSpendingByCategory(spending);
      }
    };

    const fetchSpendingByUser = async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select('*, users(email)')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        const spending = data.reduce((acc, receipt) => {
          const user = receipt.users.email;
          const amount = receipt.amount;
          const existingUser = acc.find((item) => item.name === user);
          if (existingUser) {
            existingUser.amount += amount;
          } else {
            acc.push({ name: user, amount });
          }
          return acc;
        }, []);
        setSpendingByUser(spending);
      }
    };

    fetchSpendingByCategory();
    fetchSpendingByUser();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      {error && <p className="text-red-500">{error}</p>}

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Spending by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendingByCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${currency?.symbol}${value}`} />
            <Tooltip formatter={(value) => `${currency?.symbol}${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Spending by User</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendingByUser}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${currency?.symbol}${value}`} />
            <Tooltip formatter={(value) => `${currency?.symbol}${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="amount" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
