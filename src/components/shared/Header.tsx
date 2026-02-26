import { Bell, Search as SearchIcon } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Search Bar */}
      <div className="relative w-96">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          className="pl-10 bg-gray-50 border-none" 
          placeholder="Search for friends, parks, or clinics..." 
        />
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-600 hover:text-green-600">
          <Bell size={22} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 border-l pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">Archie's Profile</p>
            <p className="text-xs text-gray-500">Vancouver, BC</p>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-green-100">
            {/* Placeholder for Archie's photo */}
            <img src="/archie-avatar.jpg" alt="Archie" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
}