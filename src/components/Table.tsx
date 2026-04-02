import React from 'react';
import { motion } from 'motion/react';
import { MoreHorizontal, Search, Filter } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  actions?: React.ReactNode;
  onRowClick?: (item: T) => void;
}

export default function Table<T extends { id: string }>({ title, data, columns, actions, onRowClick }: TableProps<T>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 border border-white/10 rounded-[48px] overflow-hidden shadow-2xl backdrop-blur-xl relative"
    >
      <div className="p-12 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-display uppercase tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">{title}</h2>
          <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.2em]">Live Data Stream • {data.length} Records</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 min-w-[240px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="FILTER DATA..."
              className="bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-white/10 w-full transition-all placeholder:text-white/10"
            />
          </div>
          <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white/30 hover:text-white group">
            <Filter className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          {actions}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] border-b border-white/5 bg-white/[0.02]">
              {columns.map((col, idx) => (
                <th key={idx} className={cn("px-12 py-10", col.className)}>
                  {col.header}
                </th>
              ))}
              <th className="px-12 py-10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "group transition-all duration-500",
                  onRowClick ? "cursor-pointer hover:bg-white/[0.04]" : "hover:bg-white/[0.04]"
                )}
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={cn("px-12 py-10", col.className)}>
                    <div className="transition-transform group-hover:translate-x-1 duration-500">
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : (item[col.accessor] as React.ReactNode)}
                    </div>
                  </td>
                ))}
                <td className="px-12 py-10 text-right">
                  <button className="p-4 hover:bg-white/10 rounded-2xl transition-all text-white/20 group-hover:text-white group-hover:scale-110 group-hover:rotate-12">
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-12 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
        <div>Showing {data.length} entries in current view</div>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:text-white hover:scale-105 active:scale-95">Previous</button>
          <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:text-white hover:scale-105 active:scale-95">Next</button>
        </div>
      </div>
    </motion.div>
  );
}
