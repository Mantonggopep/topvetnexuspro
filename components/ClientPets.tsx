import React, { useEffect, useState } from 'react';
import { ClientPortalService } from '../services/api';
import { PawPrint, Activity, FileText } from 'lucide-react';
import { format } from 'date-fns';

const ClientPets: React.FC = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const { data } = await ClientPortalService.getPets();
      setPets(data);
    } catch (error) {
      console.error("Failed to load pets", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading pets...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <PawPrint className="mr-3 text-indigo-600" /> My Pets
      </h1>

      <div className="grid gap-6">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Pet Header */}
            <div className="bg-indigo-50 p-6 flex items-center space-x-4">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                {pet.species === 'Cat' ? '🐱' : pet.species === 'Dog' ? '🐶' : '🐾'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{pet.name}</h2>
                <p className="text-gray-600">{pet.breed} • {pet.age} years old • {pet.gender}</p>
              </div>
            </div>

            {/* Pet Details & History */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" /> Vitals & Info
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex justify-between">
                    <span>Weight:</span> <span className="font-medium">{pet.weight} kg</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Microchip:</span> <span className="font-medium">{pet.microchipId || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Color:</span> <span className="font-medium">{pet.color}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" /> Recent Lab Results
                </h3>
                {pet.labResults && pet.labResults.length > 0 ? (
                  <ul className="space-y-2">
                    {pet.labResults.map((lab: any) => (
                      <li key={lab.id} className="text-sm border-l-2 border-indigo-200 pl-3 py-1">
                        <p className="font-medium text-gray-800">{lab.testType}</p>
                        <p className="text-xs text-gray-500">{format(new Date(lab.requestDate), 'MMM d, yyyy')}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic">No recent lab records found.</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {pets.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No pets linked to your account.</p>
            <p className="text-sm text-gray-400">Please contact the clinic to update your records.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPets;
