import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// Use a stable model name
const MODEL_NAME = "gemini-1.5-flash"; 

export const VeterinaryAI = {
    async suggestDiagnosis(data: any) {
        if (!apiKey) throw new Error("GEMINI_API_KEY not found in backend .env");

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `
            You are a highly experienced senior veterinarian practicing in ${data.locationContext}.
            Patient: ${data.species}, Age: ${data.age}
            Symptoms: ${data.symptoms}
            History: ${data.history}
            
            Based on the clinical signs and endemic diseases in this region:
            1. A primary tentative diagnosis.
            2. A list of 2-3 differential diagnoses.
            3. Suggested confirmatory tests.
            
            Return strictly valid JSON: { "tentative": "...", "differentials": ["..."], "tests": "..." }
            Do not use Markdown code blocks.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    },

    async generateSOAP(data: any) {
        if (!apiKey) throw new Error("GEMINI_API_KEY not found in backend .env");

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `
            You are an expert veterinary assistant.
            Create a professional SOAP note.
            Patient: ${data.petName} (${data.species})
            Raw Observations: "${data.observations}"
            
            Format as a clean Markdown string with bold headers for S, O, A, P.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    },

    async chat(data: any) {
        if (!apiKey) throw new Error("GEMINI_API_KEY not found in backend .env");

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `
            Context: ${data.context || 'None'}
            Question: ${data.query}
            Answer as a senior veterinary consultant. Be concise.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    }
};