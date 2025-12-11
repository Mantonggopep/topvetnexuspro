
import React from 'react';

interface SegmentedControlProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => {
    const activeIndex = options.indexOf(value);
    const widthPercent = 100 / options.length;

    return (
        <div className="relative bg-slate-100/80 p-1 rounded-xl flex items-center shadow-inner">
            {/* Sliding Background */}
            <div 
                className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                style={{ 
                    left: `${(activeIndex * widthPercent)}%`, 
                    marginLeft: activeIndex > 0 ? '4px' : '0', // slight adjustment for gap
                    marginRight: activeIndex < options.length - 1 ? '4px' : '0',
                    width: `calc(${widthPercent}% - 4px)`
                }}
            />
            
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`flex-1 relative z-10 py-1.5 text-xs font-bold text-center transition-colors duration-200 ${value === opt ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
};

export default SegmentedControl;
