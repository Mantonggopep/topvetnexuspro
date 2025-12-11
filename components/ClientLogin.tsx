import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientPortalService } from '../services/api';
import { PawPrint, Loader2 } from 'lucide-react';

const ClientLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await ClientPortalService.login(formData);
      navigate('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-white/50">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <PawPrint className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pet Owner Portal</h1>
          <p className="text-gray-500">Access your pet's records & appointments</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email or Phone
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g., jane@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have a login? <br />
          Contact your clinic to activate your portal account.
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
