import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, UploadCloud, FileText, Share2, Search, MessageSquare, BarChart3, LogOut, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from './Logo';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Ask AI', path: '/dashboard/ask', icon: <MessageSquare size={20} /> },
    { name: 'Upload', path: '/dashboard/upload', icon: <UploadCloud size={20} /> },
    { name: 'Search', path: '/dashboard/search', icon: <Search size={20} /> },
    { name: 'Knowledge Graph', path: '/dashboard/graph', icon: <Share2 size={20} /> },
    { name: 'Documents', path: '/dashboard/documents', icon: <FileText size={20} /> },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col relative overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
      <div className={cn("p-4 flex items-center transition-all duration-300", collapsed ? "justify-center" : "justify-between")}>
        <Logo compact={collapsed} />
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)}
            className="hidden lg:block text-slate-400 hover:text-primary-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1.5 mt-4 overflow-y-auto no-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/dashboard'}
            className={({ isActive }) => cn(
              "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-gradient-to-r from-primary-500/10 to-transparent text-primary-600 dark:text-primary-400 font-semibold" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200",
              collapsed && "justify-center"
            )}
            title={collapsed ? link.name : ""}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <div className={cn("relative z-10 transition-colors", isActive ? "text-primary-600 dark:text-primary-400" : "group-hover:text-primary-500")}>
                  {link.icon}
                </div>
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {link.name}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/50">
        {!collapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold shadow-md">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{currentUser?.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 hover:bg-red-50 dark:hover:border-red-900 dark:hover:bg-red-900/20 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold shadow-md cursor-pointer" title={currentUser?.full_name}>
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <ThemeToggle />
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
              <button 
                onClick={() => setCollapsed(false)}
                className="hidden lg:block mt-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-500 hover:text-primary-500 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className="hidden lg:block h-full z-20 flex-shrink-0"
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[260px] z-50 lg:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-50 lg:hidden">
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <X size={20} />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
