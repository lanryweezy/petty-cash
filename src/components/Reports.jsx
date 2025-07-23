import React, { useState, useEffect, useContext } from 'react';
import { getReceipts, getUsers } from '../data/models';
import { CurrencyContext } from '../CurrencyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { currency } = useContext(CurrencyContext);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [spendingByUser, setSpendingByUser] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const receipts = await getReceipts();
        const users = await getUsers();

        // Spending by category
        const byCategory = receipts.reduce((acc, receipt) => {
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
        setSpendingByCategory(byCategory);

        // Spending by user
        const byUser = receipts.reduce((acc, receipt) => {
          const user = users.find(u => u.id === receipt.user_id)?.email;
          const amount = receipt.amount;
          if (user) {
            const existingUser = acc.find((item) => item.name === user);
            if (existingUser) {
              existingUser.amount += amount;
            } else {
              acc.push({ name: user, amount });
            }
          }
          return acc;
        }, []);
        setSpendingByUser(byUser);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
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
