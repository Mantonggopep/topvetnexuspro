import React, { useEffect, useState } from 'react';
import { ClientPortalService } from '../services/api';
import { Calendar, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

const ClientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [newAppt, setNewAppt] = useState({ petId: '', date: '', time: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apptRes, petsRes] = await Promise.all([
        ClientPortalService.getDashboard(), // We can reuse dashboard or create specific endpoint if needed. using dashboard for now as it returns appts.
        ClientPortalService.getPets()
      ]);
      // Note: In a real app, you might want a dedicated getAllAppointments endpoint if the dashboard one is limited.
      // For now, we assume the dashboard endpoint gives us what we need or we update API to have getAppointments.
      // Let's use the dashboard data for display for now.
      setAppointments(apptRes.data.appointments);
      setPets(petsRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTime = new Date(`${newAppt.date}T${newAppt.time}`);
      await ClientPortalService.bookAppointment({
        petId: newAppt.petId,
        date: dateTime.toISOString(),
        reason: newAppt.reason
      });
      alert('Appointment request sent!');
      setShowForm(false);
      setNewAppt({ petId: '', date: '', time: '', reason: '' });
      fetchData(); // Refresh list
    } catch (error) {
      alert('Failed to book appointment');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="mr-3 text-indigo-600" /> Appointments
        </h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Book Visit
        </button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 mb-8 animate-fade-in-down">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Request New Appointment</h3>
          <form onSubmit={handleBook} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Pet</label>
                <select 
                  required
                  className="w-full border rounded-lg p-2"
                  value={newAppt.petId}
                  onChange={e => setNewAppt({...newAppt, petId: e.target.value})}
                >
                  <option value="">-- Choose Pet --</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input 
                  type="text" required
                  placeholder="e.g. Annual Vaccination"
                  className="w-full border rounded-lg p-2"
                  value={newAppt.reason}
                  onChange={e => setNewAppt({...newAppt, reason: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" required
                  className="w-full border rounded-lg p-2"
                  value={newAppt.date}
                  onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <input 
                  type="time" required
                  className="w-full border rounded-lg p-2"
                  value={newAppt.time}
                  onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No appointments scheduled.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {format(new Date(apt.date), 'MMMM d, yyyy')}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(apt.date), 'h:mm a')}</span>
                      <span>•</span>
                      <span>{apt.reason}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${apt.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'}`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAppointments;
