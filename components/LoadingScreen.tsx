
import React from 'react';
import { PawPrint } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading..." }) => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-500">
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                {/* Walking Paws Animation */}
                <div className="absolute top-0 left-0 paw-print text-primary-400"><PawPrint className="w-8 h-8 rotate-[-15deg]" /></div>
                <div className="absolute top-4 right-4 paw-print text-primary-500"><PawPrint className="w-8 h-8 rotate-[15deg]" /></div>
                <div className="absolute bottom-4 left-4 paw-print text-primary-600"><PawPrint className="w-8 h-8 rotate-[-10deg]" /></div>
                <div className="absolute bottom-0 right-8 paw-print text-primary-700"><PawPrint className="w-8 h-8 rotate-[10deg]" /></div>
            </div>
            <h3 className="text-xl font-bold text-slate-700 animate-pulse">{message}</h3>
            <p className="text-sm text-slate-400 mt-2">Preparing your data...</p>
        </div>
    );
};

export default LoadingScreen;
