import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, UploadCloud, FileText, Menu, X, Database, Share2, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Upload', path: '/upload', icon: <UploadCloud size={20} /> },
    { name: 'Search', path: '/search', icon: <Search size={20} /> },
    { name: 'Knowledge Graph', path: '/graph', icon: <Share2 size={20} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={20} /> },
  ];

  return (
    <motion.div 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="glass border-r border-white/10 h-full flex flex-col z-10 transition-all duration-300 relative"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-primary font-bold text-xl">
            <Database size={24} />
            <span>Compliance KG</span>
          </motion.div>
        )}
        {collapsed && (
           <div className="mx-auto text-primary"><Database size={24} /></div>
        )}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={cn("text-slate-400 hover:text-white transition-colors", collapsed ? "absolute -right-3 bg-surface p-1 rounded-full border border-white/10" : "")}
        >
          {collapsed ? <Menu size={16} /> : <X size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive 
                ? "bg-primary/20 text-primary font-medium" 
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
            title={collapsed ? link.name : ""}
          >
            {link.icon}
            {!collapsed && <span>{link.name}</span>}
          </NavLink>
        ))}
      </nav>
      
      {!collapsed && (
        <div className="p-6 m-4 bg-gradient-to-br from-primary/20 to-purple-500/10 rounded-xl border border-white/5 text-sm text-slate-300">
          <p className="font-semibold text-white mb-1">System Status</p>
          <p>All services are operational.</p>
        </div>
      )}
    </motion.div>
  );
}
