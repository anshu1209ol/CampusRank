import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon, LayoutDashboard, LogOut, Settings, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => (
  <Link
    to={href}
    className={cn(
      'w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group border border-transparent',
      active 
        ? 'bg-white text-black shadow-2xl shadow-white/10 font-bold' 
        : 'text-white/40 hover:text-white hover:bg-white/5 hover:border-white/10'
    )}
  >
    <div className={cn(
      "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
      active ? "bg-black text-white" : "bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10"
    )}>
      <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active ? "text-white" : "")} />
    </div>
    <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
  </Link>
);

interface SidebarProps {
  items: SidebarItemProps[];
  logoIcon: LucideIcon;
  logoColor: string;
}

export default function Sidebar({ items, logoIcon: LogoIcon, logoColor }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(true);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "w-80 border-r border-white/5 p-8 flex flex-col gap-10 bg-[#050505] fixed lg:sticky top-0 h-screen z-[70] transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 px-2 group" onClick={() => setIsOpen(false)}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3", logoColor)}>
              <LogoIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-display uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
              CampusRank
            </span>
          </Link>
          <button 
            className="lg:hidden p-2 text-white/50 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Main Menu</span>
          </div>
          {items.map((item) => (
            <div key={item.label} onClick={() => setIsOpen(false)}>
              <SidebarItem 
                {...item} 
                active={item.href === '/teacher' || item.href === '/admin' || item.href === '/student' 
                  ? location.pathname === item.href 
                  : location.pathname.startsWith(item.href)} 
              />
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Account</span>
          </div>
          <div onClick={() => setIsOpen(false)}>
            <SidebarItem icon={Settings} label="Settings" href="/settings" active={location.pathname === '/settings'} />
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
