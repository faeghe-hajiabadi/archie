import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Users, Heart, ShoppingBag, Search, LogOut } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabaseClient';

const menuItems = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Map', icon: Map, path: '/map' },
  { name: 'Friends', icon: Users, path: '/friends' },
  { name: 'Health', icon: Heart, path: '/health' },
  { name: 'Marketplace', icon: ShoppingBag, path: '/marketplace' },
  { name: 'Lost and Found', icon: Search, path: '/lost-found' },
];

export default function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
  };

  return (
    <div className={cn("bg-white border-r h-full flex flex-col p-4", className)}>
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">A</div>
        <span className="text-xl font-bold tracking-tight">Archie</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive ? "text-green-600 bg-green-50" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-600 transition-colors mt-auto disabled:opacity-50"
      >
        <LogOut size={20} />
        <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>
      </button>
    </div>
  );
}