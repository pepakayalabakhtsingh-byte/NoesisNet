import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import PageTransition from './PageTransition';
import { Menu } from 'lucide-react';
import Logo from './Logo';
import { AnimatePresence } from 'framer-motion';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Mobile Topbar */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-16 glass-nav z-40 flex items-center justify-between px-4">
        <Logo compact={false} className="text-xl" />
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      <main className="flex-1 relative overflow-y-auto pt-16 lg:pt-0">
        {/* Animated Background Mesh */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 -right-40 w-96 h-96 bg-secondary-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-40 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 w-full h-full p-4 lg:p-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
