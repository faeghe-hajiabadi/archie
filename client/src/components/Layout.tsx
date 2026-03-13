import { Outlet, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4 w-1/3">
          <Link to="/" className="font-bold text-xl tracking-tight">Archie 🐾</Link>
          <Input type="search" placeholder="Search..." className="max-w-xs rounded-full bg-slate-100 border-none" />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden sm:block">Archie's Profile</span>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1 mx-auto w-full">
        {/* Left Sidebar */}
        <aside className="w-48 p-6 flex flex-col gap-4 border-r hidden md:flex">
          <nav className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-black py-2">Home</Link>
            <Link to="/map" className="hover:text-black py-2">Map</Link>
            <Link to="/friends" className="hover:text-black py-2">Friends</Link>
            <Link to="/health" className="hover:text-black py-2">Health</Link>
            <Link to="/marketplace" className="hover:text-black py-2">Marketplace</Link>
            <Link to="/lost-and-found" className="hover:text-black py-2">Lost and Found</Link>
          </nav>
        </aside>

        {/* Main Content Area (This is where your pages will render!) */}
        <main className="flex-1 p-6">
          <Outlet /> 
        </main>
      </div>

      {/* Footer */}
      <Separator />
      <footer className="h-16 flex items-center justify-between px-6 text-sm font-medium text-slate-500">
        <span>Safety Tips</span>
        <div className="flex gap-4">
          <span>Explore</span>
          <span>Dog Park Map</span>
        </div>
        <span>Copyright © 2026</span>
      </footer>
    </div>
  );
}