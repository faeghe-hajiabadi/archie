import type { ReactNode } from 'react'
import Sidebar from './Sidebar.tsx'
import Header from './Header.tsx'

interface LayoutProps {
  children: ReactNode
  onLogout?: () => void
}

export default function Layout({ children, onLogout }: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* 1. Permanent Sidebar */}
      <Sidebar className="hidden md:flex w-64 flex-col fixed inset-y-0" onLogout={onLogout} />
  
        {/* 2. Main Content Area */}
        <div className="flex-1 flex flex-col md:pl-64">
          {/* 3. Global Header */}
          <Header />
  
          {/* 4. Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
  )
}