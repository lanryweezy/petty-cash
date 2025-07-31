import React, { useState, useEffect, useContext } from 'react';

import { CurrencyContext } from '../CurrencyContext.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { currency } = useContext(CurrencyContext);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [spendingByUser, setSpendingByUser] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSpendingByCategory = async () => {
      try {
        const { rows } = await pool.query(`
          SELECT r.purpose, SUM(receipts.amount) as amount
          FROM receipts
          JOIN requests r ON receipts.request_id = r.id
          GROUP BY r.purpose
        `);
        setSpendingByCategory(rows.map(row => ({ name: row.purpose, amount: parseFloat(row.amount) })));
      } catch (error) {
        setError(error.message);
      }
    };

    const fetchSpendingByUser = async () => {
      try {
        const { rows } = await pool.query(`
          SELECT u.email, SUM(receipts.amount) as amount
          FROM receipts
          JOIN users u ON receipts.user_id = u.id
          GROUP BY u.email
        `);
        setSpendingByUser(rows.map(row => ({ name: row.email, amount: parseFloat(row.amount) })));
      } catch (error) {
        setError(error.message);
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