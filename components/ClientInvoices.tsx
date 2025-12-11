import React, { useEffect, useState } from 'react';
import { ClientPortalService } from '../services/api';
import { Receipt, Download, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ClientInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data } = await ClientPortalService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id: string) => {
    // In a real app, this would trigger a PDF download endpoint
    alert(`Downloading invoice #${id.substring(0, 8)}...`);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading billing history...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Receipt className="mr-3 text-indigo-600" /> Invoices & Receipts
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Receipt className="text-gray-400 w-8 h-8" />
            </div>
            <h3 className="text-gray-900 font-medium">No Invoices Found</h3>
            <p className="text-gray-500 text-sm mt-1">You don't have any billing history with us yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {format(new Date(inv.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    Services & Products
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ${inv.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                        inv.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {inv.status === 'Paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {inv.status !== 'Paid' && (
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium inline-flex items-center" title="Pay Now">
                            <CreditCard className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                      onClick={() => handleDownload(inv.id)}
                      className="text-gray-400 hover:text-gray-600 inline-flex items-center" 
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientInvoices;
