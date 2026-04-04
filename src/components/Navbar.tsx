import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Rocket, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Analytics', href: '#analytics' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent',
        isScrolled ? 'bg-black/80 backdrop-blur-2xl border-white/5 py-4' : 'bg-transparent py-8'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-neon-purple/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 overflow-hidden">
            <img src="/logo.png" alt="SkillForge Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-3xl fiery-text">
            SkillForge
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-bold text-white/50 hover:text-white transition-all uppercase tracking-widest relative group"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-1 bg-neon-purple transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/login"
            className="px-6 py-2 text-sm font-bold text-white/60 hover:text-white transition-colors uppercase tracking-widest"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-8 py-3 text-sm font-bold bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10 uppercase tracking-widest flex items-center gap-2 group"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black z-[60] p-8 md:hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-16">
              <Link to="/" className="flex items-center gap-4" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="SkillForge Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-2xl fiery-text leading-none">SkillForge</span>
              </Link>
              <button
                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-5xl font-display uppercase tracking-tighter hover:text-neon-purple transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-6">
              <Link
                to="/login"
                className="text-center py-5 text-2xl font-display uppercase tracking-widest border border-white/10 rounded-3xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="text-center py-5 bg-white text-black rounded-3xl text-2xl font-display uppercase tracking-widest"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
