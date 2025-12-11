import React from 'react';
import { Home, Users, Calendar, CreditCard, Menu } from 'lucide-react';
import { ViewType } from '../types';

interface MobileNavbarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenMenu: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ currentView, onNavigate, onOpenMenu }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Schedule', icon: Calendar },
    { id: 'pos', label: 'POS', icon: CreditCard },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewType)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavbar;
