import React, { useState, useEffect } from 'react';
import { getCurrencies, saveCurrency, setDefaultCurrency } from '../data/models';

const Currencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    const currencies = await getCurrencies();
    setCurrencies(currencies);
  };

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
  };

  const handleCancel = () => {
    setEditingCurrency(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await saveCurrency(editingCurrency);
      setSuccess('Currency saved successfully!');
      setEditingCurrency(null);
      fetchCurrencies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, code, exchange_rate } = e.target.elements;
    try {
      await saveCurrency({
        name: name.value,
        code: code.value,
        exchange_rate: exchange_rate.value,
      });
      setSuccess('Currency added successfully!');
      fetchCurrencies();
      e.target.reset();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Currencies</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Add Currency</h3>
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Currency Name"
              className="border p-2"
              required
            />
            <input
              type="text"
              name="code"
              placeholder="Currency Code"
              className="border p-2"
              required
            />
            <input
              type="number"
              name="exchange_rate"
              placeholder="Exchange Rate"
              className="border p-2"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Currency
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Manage Currencies</h3>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Code</th>
              <th className="py-2">Exchange Rate</th>
              <th className="py-2">Default</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr key={currency.id}>
                <td className="border px-4 py-2">{currency.name}</td>
                <td className="border px-4 py-2">{currency.code}</td>
                <td className="border px-4 py-2">{currency.exchange_rate}</td>
                <td className="border px-4 py-2">
                  <input
                    type="radio"
                    name="is_default"
                    checked={currency.is_default}
                    onChange={async () => {
                      try {
                        await setDefaultCurrency(currency.id);
                        fetchCurrencies();
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                  />
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleEdit(currency)}
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

      {editingCurrency && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold">Edit Currency</h3>
            <form onSubmit={handleSave}>
              <div className="my-4">
                <label>Name</label>
                <input
                  type="text"
                  value={editingCurrency.name}
                  onChange={(e) =>
                    setEditingCurrency({
                      ...editingCurrency,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border"
                />
              </div>
              <div className="my-4">
                <label>Code</label>
                <input
                  type="text"
                  value={editingCurrency.code}
                  onChange={(e) =>
                    setEditingCurrency({
                      ...editingCurrency,
                      code: e.target.value,
                    })
                  }
                  className="w-full p-2 border"
                />
              </div>
              <div className="my-4">
                <label>Exchange Rate</label>
                <input
                  type="number"
                  value={editingCurrency.exchange_rate}
                  onChange={(e) =>
                    setEditingCurrency({
                      ...editingCurrency,
                      exchange_rate: e.target.value,
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

export default Currencies;
