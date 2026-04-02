import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ label, value, icon: Icon, color, bg, trend, trendUp }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white/5 border border-white/10 rounded-[40px] p-10 hover:bg-white/10 transition-all group backdrop-blur-md relative overflow-hidden"
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20 transition-opacity group-hover:opacity-40", bg)} />
      
      <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl", bg)}>
        <Icon className={cn("w-8 h-8", color)} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="text-5xl font-display uppercase tracking-tighter text-white">{value}</div>
          {trend && (
            <div className={cn(
              "text-[10px] font-mono font-bold px-3 py-1.5 rounded-full uppercase tracking-widest",
              trendUp ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"
            )}>
              {trendUp ? '↑' : '↓'} {trend}%
            </div>
          )}
        </div>
        <div className="text-xs font-mono text-white/30 uppercase tracking-[0.2em]">{label}</div>
      </div>
    </motion.div>
  );
}
