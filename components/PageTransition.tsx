import React from 'react';

interface PageTransitionProps {
    children: React.ReactNode;
    view: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, view }) => {
    return (
        <div className="w-full h-full relative">
            {/* Subtle Ambient Background Gradient (8k Detail) */}
            <div className="fixed top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-100/30 to-transparent pointer-events-none -z-10 opacity-60" />
            
            <div 
                key={view} 
                className="w-full animate-slide-up origin-center"
            >
                {children}
            </div>
        </div>
    );
};

export default PageTransition;