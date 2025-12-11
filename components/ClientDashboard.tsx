import React, { useEffect, useState } from 'react';
import { ClientPortalService } from '../services/api';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const ClientDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await ClientPortalService.getDashboard();
      setData(res.data);
    } catch (error) {
      console.error("Failed to load dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading your pet's info...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back! 👋</h1>
        <p className="text-gray-500">Here's what's happening with your pets today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pets Summary Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
             My Pets
          </h3>
          <div className="space-y-3">
            {data.pets.length === 0 ? (
              <p className="text-sm text-gray-400">No pets registered yet.</p>
            ) : (
              data.pets.map((pet: any) => (
                <div key={pet.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {pet.name[0]}
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">{pet.name}</p>
                        <p className="text-xs text-gray-500">{pet.species} • {pet.breed || 'Unknown'}</p>
                    </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Upcoming Visits
          </h3>
          <div className="space-y-3">
            {data.appointments.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                No upcoming appointments.
              </div>
            ) : (
              data.appointments.map((apt: any) => (
                <div key={apt.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                  <div className="mt-1">
                    <Clock className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {format(new Date(apt.date), 'MMM d, yyyy @ h:mm a')}
                    </p>
                    <p className="text-xs text-gray-500">{apt.reason || 'General Checkup'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full uppercase tracking-wider font-semibold">
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Billing Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-500" /> Outstanding Invoices
          </h3>
          {data.unpaidInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-green-500">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">All caught up!</span>
            </div>
          ) : (
             <div className="space-y-3">
                {data.unpaidInvoices.map((inv: any) => (
                    <div key={inv.id} className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100">
                        <span className="text-sm text-red-700 font-medium">{format(new Date(inv.date), 'MMM d')}</span>
                        <span className="text-sm font-bold text-red-800">${inv.total}</span>
                    </div>
                ))}
                <button className="w-full mt-2 py-2 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700">
                    Pay Now
                </button>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ClientDashboard;
