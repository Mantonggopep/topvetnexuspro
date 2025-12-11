
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, LayoutDashboard, Users, Calendar, Settings, FileText } from 'lucide-react';
import { ViewType } from '../types';

interface SpotlightSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: ViewType) => void;
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Handle Esc key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const actions = [
        { label: 'Go to Dashboard', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
        { label: 'View Patients', icon: Users, action: () => onNavigate('patients') },
        { label: 'Schedule Appointment', icon: Calendar, action: () => onNavigate('appointments') },
        { label: 'Open Settings', icon: Settings, action: () => onNavigate('settings') },
        { label: 'View Reports', icon: FileText, action: () => onNavigate('reports') },
    ];

    const filteredActions = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-fade-in" onClick={onClose}>
            <div 
                className="w-full max-w-xl bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden animate-scale-in transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-4 border-b border-slate-200/50">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search or jump to..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-slate-800 placeholder-slate-400"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="px-2 py-1 bg-slate-200/50 rounded text-xs font-bold text-slate-500">ESC</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => { action.action(); onClose(); }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-primary-500 hover:text-white group transition-colors text-left"
                        >
                            <div className="flex items-center">
                                <action.icon className="w-5 h-5 mr-3 text-slate-500 group-hover:text-white" />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-white">{action.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-white/70" />
                        </button>
                    ))}
                    {filteredActions.length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-400 text-sm">
                            No results found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpotlightSearch;
