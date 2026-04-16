import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Folder, Settings, Cpu, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'My Projects', path: '/projects', icon: Folder },
    { name: 'Devices', path: '/devices', icon: Cpu },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-20 bg-[#0B1020] border-r border-white/10 flex flex-col items-center py-6 z-50">
      <div className="mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Activity className="text-white w-6 h-6" />
        </div>
      </div>
      
      <div className="flex flex-col gap-6 w-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors group relative",
                isActive ? "text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full -ml-2" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600">
           {/* User Avatar Placeholder */}
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
      </div>
    </nav>
  );
}
