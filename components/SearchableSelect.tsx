
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    subLabel?: string;
    image?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Select...", label, disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border ${isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-300'} rounded-lg py-2 px-3 text-left shadow-sm focus:outline-none flex justify-between items-center transition-all ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'hover:border-slate-400'}`}
            >
                <div className="flex items-center overflow-hidden">
                    {selectedOption ? (
                        <>
                           {selectedOption.image && <img src={selectedOption.image} alt="" className="w-5 h-5 rounded-full mr-2 object-cover" />}
                           <div className="flex flex-col truncate">
                               <span className="block text-sm font-medium text-slate-800">{selectedOption.label}</span>
                               {selectedOption.subLabel && <span className="block text-xs text-slate-500 truncate">{selectedOption.subLabel}</span>}
                           </div>
                        </>
                    ) : (
                        <span className="text-slate-500 text-sm">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-slate-200 max-h-60 flex flex-col animate-scale-up">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-md">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                autoFocus
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-primary-500"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${value === opt.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    {opt.image && <img src={opt.image} alt="" className="w-6 h-6 rounded-full mr-3 object-cover bg-slate-200" />}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{opt.label}</p>
                                        {opt.subLabel && <p className="text-xs text-slate-500">{opt.subLabel}</p>}
                                    </div>
                                    {value === opt.id && <Check className="w-4 h-4 text-primary-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="py-3 text-center text-sm text-slate-400">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
