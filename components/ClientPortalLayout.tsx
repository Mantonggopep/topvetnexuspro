import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  PawPrint, 
  Receipt, 
  MessageCircle, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { AuthService } from '../services/api';

const ClientPortalLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate('/portal/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
    { label: 'My Pets', path: '/portal/pets', icon: PawPrint },
    { label: 'Appointments', path: '/portal/appointments', icon: Calendar },
    { label: 'Invoices', path: '/portal/invoices', icon: Receipt },
    { label: 'Messages', path: '/portal/messages', icon: MessageCircle },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600">MyClinic Portal</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <span className="font-bold text-indigo-600">MyClinic Portal</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 z-50">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              ))}
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientPortalLayout;
