import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface HeaderProps {
  title: string;
  subtitle: string;
  userInitials: string;
  userColor: string;
}

export default function Header({ title, subtitle, userInitials, userColor }: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme as 'dark' | 'light');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 sticky top-0 z-40 bg-[#050505]/90 light:bg-gray-50/90 backdrop-blur-2xl py-8 border-b border-white/5 light:border-slate-200/50 transition-colors">
      <div>
        <h1 className="text-5xl font-display uppercase tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40 light:from-slate-900 light:to-slate-600 transition-colors">{title}</h1>
        <p className="text-white/30 light:text-slate-500 font-mono text-xs uppercase tracking-[0.2em] transition-colors">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        <div className="relative hidden xl:block group flex-1 max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 light:text-slate-400 group-focus-within:text-white light:group-focus-within:text-slate-800 transition-colors" />
          <input
            type="text"
            placeholder="SEARCH BENCHMARKS..."
            className="bg-white/5 light:bg-white border border-white/10 light:border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-xs font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-white/10 light:focus:ring-slate-300 w-full transition-all placeholder:text-white/10 light:placeholder:text-slate-400 light:text-slate-800"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-4 bg-white/5 light:bg-white border border-white/10 light:border-slate-200 rounded-2xl hover:bg-white/10 light:hover:bg-slate-50 transition-all relative group"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />
            )}
          </button>

          <button className="p-4 bg-white/5 light:bg-white border border-white/10 light:border-slate-200 rounded-2xl hover:bg-white/10 light:hover:bg-slate-50 transition-all relative group">
            <Bell className="w-5 h-5 text-white/40 light:text-slate-500 group-hover:text-white light:group-hover:text-slate-800 transition-colors" />
            <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505] light:border-white" />
          </button>
          
          <Link to="/profile" className="flex items-center gap-4 pl-4 border-l border-white/10 light:border-slate-200 group cursor-pointer hover:bg-white/5 light:hover:bg-slate-100 rounded-2xl transition-all p-2 -mr-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold uppercase tracking-wider text-white light:text-slate-900 group-hover:text-neon-purple transition-colors">Verified User</div>
              <div className="text-[10px] font-mono text-white/30 light:text-slate-500 uppercase tracking-widest line-clamp-1 transition-colors">Premium Tier</div>
            </div>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-display text-xl text-white shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3 border border-white/10 light:border-slate-200", userColor)}>
              {userInitials}
            </div>
          </Link>
        </div>
        
        <button 
          onClick={() => window.dispatchEvent(new Event('toggle-mobile-sidebar'))}
          className="lg:hidden p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
