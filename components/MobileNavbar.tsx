import React from 'react';
import { Home, Users, Calendar, CreditCard, Menu, Activity, ClipboardList } from 'lucide-react';
import { ViewType } from '../types';

interface MobileNavbarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenMenu: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ currentView, onNavigate, onOpenMenu }) => {
  // Configured principal navigation items
  const navItems = [
    { id: 'dashboard', icon: Home },
    { id: 'patients', icon: Users },
    { id: 'appointments', icon: Calendar },
    { id: 'treatments', icon: Activity },
    { id: 'pos', icon: CreditCard },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <nav className="pointer-events-auto glass-nav rounded-full flex items-center px-2 py-2 gap-2 shadow-2xl shadow-black/20">
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewType)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-black shadow-lg scale-110 -translate-y-2' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {isActive && (
                <span className="absolute -bottom-3 w-1 h-1 rounded-full bg-white/50 animate-pulse"></span>
              )}
            </button>
          );
        })}
        
        <div className="w-px h-6 bg-white/20 mx-1"></div>

        <button
          onClick={onOpenMenu}
          className="relative flex items-center justify-center w-12 h-12 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <Menu className="w-6 h-6" />
        </button>

      </nav>
    </div>
  );
};

export default MobileNavbar;