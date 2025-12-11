
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface DynamicIslandProps {
    type: ToastType;
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

const DynamicIsland: React.FC<DynamicIslandProps> = ({ type, message, isVisible, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Sequence: Small Pill -> Expand -> Wait -> Contract -> Hide
            setIsExpanded(true);
            const timer = setTimeout(() => {
                setIsExpanded(false);
                setTimeout(onClose, 300); // Wait for contraction anim
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setIsExpanded(false);
        }
    }, [isVisible, onClose]);

    if (!isVisible && !isExpanded) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'loading': return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex justify-center">
            <div 
                className={`
                    bg-black/90 backdrop-blur-xl shadow-2xl rounded-[2rem] text-white overflow-hidden transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
                    ${isExpanded ? 'w-auto min-w-[300px] px-4 py-3' : 'w-[10px] h-[10px] opacity-0'}
                `}
            >
                <div className={`flex items-center space-x-3 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="shrink-0">
                        {getIcon()}
                    </div>
                    <div className="flex-1 text-sm font-medium tracking-wide">
                        {message}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DynamicIsland;
