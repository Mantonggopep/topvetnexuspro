
import React from 'react';
import { getPageBackground } from '../utils/uiUtils';

interface PageTransitionProps {
    children: React.ReactNode;
    view: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, view }) => {
    const bgClass = getPageBackground(view);

    return (
        <div className={`flex-1 h-full overflow-hidden relative ${bgClass} transition-colors duration-700 ease-in-out`}>
            {/* Soft decorative blur orbs */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/30 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-white/30 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{animationDelay: '1s'}}></div>
            
            <div key={view} className="h-full overflow-y-auto p-6 animate-slide-up relative z-10 custom-scrollbar">
                {children}
            </div>
        </div>
    );
};

export default PageTransition;
