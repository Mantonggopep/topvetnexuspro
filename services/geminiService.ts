import api from './api';

// --- 1. SOAP Note Generator ---
export const generateSOAPNote = async (
  observations: string,
  petName: string,
  species: string
): Promise<string> => {
  try {
    const response = await api.post('/ai/soap', {
      observations,
      petName,
      species
    });
    return response.data.content;
  } catch (error) {
    console.error("SOAP Note Error:", error);
    return "Error: Unable to connect to AI service. Please ensure the backend is running.";
  }
};

// --- 2. Diagnosis Assistant ---
export const suggestDiagnosis = async (
    species: string,
    age: number | string,
    symptoms: string,
    history: string,
    locationContext: string = "West Africa/Nigeria"
): Promise<string> => {
    try {
        const response = await api.post('/ai/diagnose', {
            species,
            age,
            symptoms,
            history,
            locationContext
        });
        
        // The UI expects a stringified JSON (based on your previous code structure)
        // If the backend returns an object, we stringify it here to maintain compatibility.
        return typeof response.data === 'string' 
            ? response.data 
            : JSON.stringify(response.data);

    } catch (error) {
        console.error("Diagnosis Error:", error);
        return JSON.stringify({ 
            tentative: "AI Service Unavailable", 
            differentials: [], 
            tests: "Check backend connection" 
        });
    }
}

// --- 3. Chat Assistant ---
export const askVetAssistant = async (
  query: string,
  context?: string
): Promise<string> => {
  try {
    const response = await api.post('/ai/chat', { 
      query, 
      context 
    });
    return response.data.answer;
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to the AI service right now. Please try again later.";
  }
};