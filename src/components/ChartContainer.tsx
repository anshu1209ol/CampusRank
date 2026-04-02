import React from 'react';
import { motion } from 'motion/react';
import { Download, Filter } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export default function ChartContainer({ title, subtitle, children, className, actions }: ChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("bg-white/5 border border-white/10 rounded-[48px] p-12 backdrop-blur-xl relative overflow-hidden", className)}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-display uppercase tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">{title}</h2>
          {subtitle && <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.2em]">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-3">
          {actions || (
            <>
              <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white/30 hover:text-white group">
                <Filter className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white/30 hover:text-white group">
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="w-full relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
