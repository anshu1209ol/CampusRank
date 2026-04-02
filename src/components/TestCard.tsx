import React from 'react';
import { motion } from 'motion/react';
import { Clock, TrendingUp, ChevronRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TestCardProps {
  id: string;
  title: string;
  duration: string;
  date: string;
  category: string;
}

export default function TestCard({ id, title, duration, date, category }: TestCardProps) {
  return (
    <Link to={`/test/${id}`} className="group block">
      <motion.div
        whileHover={{ scale: 1.02, y: -8 }}
        whileTap={{ scale: 0.98 }}
        className="p-10 bg-white/5 border border-white/10 rounded-[48px] hover:bg-white/10 hover:border-violet-500/30 transition-all duration-500 backdrop-blur-2xl relative overflow-hidden group/card"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 blur-[80px] group-hover/card:bg-violet-600/20 transition-all duration-700 -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/5 blur-[60px] group-hover/card:bg-indigo-600/10 transition-all duration-700 -ml-10 -mb-10" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-[0.4em]">{category}</span>
              </div>
              <h3 className="text-3xl font-display uppercase tracking-tighter leading-none group-hover/card:text-violet-400 transition-colors line-clamp-2 max-w-[80%]">{title}</h3>
            </div>
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover/card:bg-white group-hover/card:text-black transition-all shadow-2xl group-hover/card:shadow-white/20 active:scale-90">
              <ChevronRight className="w-8 h-8 group-hover/card:translate-x-1 transition-transform" />
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-mono font-bold text-white/20 uppercase tracking-widest">Duration</span>
                <span className="text-xs font-mono font-bold text-white/60 uppercase tracking-widest">{duration}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-mono font-bold text-white/20 uppercase tracking-widest">Available</span>
                <span className="text-xs font-mono font-bold text-white/60 uppercase tracking-widest">{date}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
