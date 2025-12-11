import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  TestTube, 
  ShoppingBag, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu,
  ChevronLeft,
  FileBarChart,
  Shield,
  Activity
} from "lucide-react";
import { AppState } from "../types";

// Removed UserRole import to avoid "used as value" error if it's just a type.
// We will check the string 'SuperAdmin' directly.

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  currentUser: AppState["currentUser"];
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  currentUser
}) => {
  
  // Navigation Items Configuration
  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard }, // lowercase IDs to match App.tsx switch
    { id: "clients", label: "Patients", icon: Users },
    { id: "appointments", label: "Schedule", icon: Calendar },
    { id: "treatments", label: "Consultations", icon: Stethoscope },
    { id: "lab", label: "Lab Results", icon: TestTube },
    { id: "pos", label: "Payments", icon: CreditCard },
    { id: "inventory", label: "Inventory", icon: ShoppingBag },
    { id: "reports", label: "Reports", icon: FileBarChart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Super Admin Item Check
  // Fix: Check 'roles' array instead of 'role' property
  if (currentUser?.roles && currentUser.roles.includes('SuperAdmin')) {
    navItems.splice(1, 0, { id: "superadmin", label: "Admin", icon: Shield });
  }

  return (
    <div 
      className={`
        relative flex flex-col h-full transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"}
        bg-white border-r border-slate-200 shadow-sm z-20 hidden md:flex
      `}
    >
      {/* --- LOGO AREA --- */}
      <div className={`h-20 flex items-center px-6 mb-2 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 animate-fade-in whitespace-nowrap overflow-hidden">
            <div className="min-w-[32px] w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-200">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">
              Vet<span className="text-teal-600">Nexus</span>
            </span>
          </div>
        )}
        
        {/* If collapsed, show the logo icon as the header */}
        {isCollapsed && (
           <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Activity className="w-6 h-6" />
           </div>
        )}

        {!isCollapsed && (
          <button 
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* --- NAVIGATION LINKS --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1 py-4">
        {navItems.map((item) => {
          // Case-insensitive check just in case
          const isActive = currentView.toLowerCase() === item.id.toLowerCase();
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                group relative flex items-center w-full p-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? "bg-teal-50 text-teal-700 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }
              `}
            >
              <div className={`
                flex items-center justify-center transition-colors duration-200
                ${isCollapsed ? "w-full" : ""}
                ${isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}
              `}>
                <Icon className="w-5 h-5" />
              </div>

              {!isCollapsed && (
                <span className={`ml-3 text-sm font-bold truncate transition-colors ${isActive ? "text-teal-800" : "text-slate-600"}`}>
                  {item.label}
                </span>
              )}
              
              {/* Active Indicator (Left Bar) */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full" />
              )}

              {/* Tooltip for Collapsed State */}
              {isCollapsed && (
                <div className="
                  absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg 
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl
                  translate-x-2 group-hover:translate-x-0 transform duration-200
                ">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* --- COLLAPSE TRIGGER --- */}
      {isCollapsed && (
        <button 
          onClick={onToggleCollapse}
          className="mx-auto mb-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* --- USER PROFILE / FOOTER --- */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-white shadow-sm flex items-center justify-center overflow-hidden">
               {currentUser?.avatarUrl ? (
                   <img src={currentUser.avatarUrl} alt="User" className="w-full h-full object-cover" />
               ) : (
                   <span className="font-bold text-slate-600 text-sm">
                     {currentUser?.name?.[0] || "U"}
                   </span>
               )}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {currentUser?.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-wider">
                {/* Display first role or 'Staff' */}
                {currentUser?.roles && currentUser.roles.length > 0 ? currentUser.roles[0] : 'Staff'}
              </p>
            </div>
          )}

          {!isCollapsed && (
             <button 
               onClick={onLogout}
               className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
               title="Logout"
             >
               <LogOut className="w-4 h-4" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
