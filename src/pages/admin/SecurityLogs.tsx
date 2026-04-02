import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Search, 
  Filter, 
  Activity, 
  Server, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Building2,
  Loader2,
  Terminal,
  Cpu,
  Globe
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Table from '@/src/components/Table';
import StatCard from '@/src/components/StatCard';

const sidebarItems = [
  { icon: Activity, label: 'System Overview', href: '/admin' },
  { icon: Users, label: 'User Management', href: '/admin/users' },
  { icon: Building2, label: 'Colleges', href: '/admin/colleges' },
  { icon: Shield, label: 'Security Logs', href: '/admin/security' },
];

export default function SecurityLogs() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real alerts from Firestore as security logs
    const alertsQuery = query(
      collection(db, 'alerts'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          time: d.timestamp?.toDate ? d.timestamp.toDate().toLocaleTimeString() : 'N/A',
          event: d.type === 'tab_switch' ? 'TAB_SWITCH_DETECTED' : d.type === 'ai_monitoring' ? 'AI_INTEGRITY_VIOLATION' : 'SECURITY_EVENT',
          subject: d.studentName || 'Unknown',
          status: d.type === 'tab_switch' ? 'FLAGGED' : 'ALERT',
          severity: d.type === 'ai_monitoring' ? 'high' : 'medium',
          details: d.details,
        };
      });
      setLogs(data);
      setLoading(false);
    }, () => {
      // Fallback if query fails (e.g., no index)
      setLogs([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = {
    uptime: '99.99%',
    activeNodes: 12,
    threatsBlocked: logs.filter(l => l.severity === 'high').length,
    avgLatency: '42ms'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar 
        items={sidebarItems} 
        logoIcon={Shield} 
        logoColor="bg-amber-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <Header 
          title="Security Infrastructure" 
          subtitle="Global system monitoring and protocol audit logs" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'} 
          userColor="bg-amber-500" 
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <StatCard label="System Uptime" value={stats.uptime} icon={Activity} color="text-emerald-400" bg="bg-emerald-400/20" />
          <StatCard label="Active Nodes" value={stats.activeNodes.toString()} icon={Cpu} color="text-blue-400" bg="bg-blue-400/20" />
          <StatCard label="Threats Blocked" value={stats.threatsBlocked.toString()} icon={Shield} color="text-red-400" bg="bg-red-400/20" />
          <StatCard label="Avg. Latency" value={stats.avgLatency} icon={Globe} color="text-amber-400" bg="bg-amber-400/20" />
        </div>

        <div className="p-12 bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-2xl relative overflow-hidden group mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-3xl font-display uppercase tracking-tighter">Live Protocol Stream</h3>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] hover:text-white transition-colors">Export Logs</button>
              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] hover:text-white transition-colors">Clear Stream</button>
            </div>
          </div>
          
          <div className="space-y-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-8 py-6 border-b border-white/5 last:border-0 group/log hover:bg-white/5 px-6 rounded-2xl transition-colors">
                <span className="text-amber-500/60 w-24">{log.time}</span>
                <span className={`w-64 ${
                  log.severity === 'high' ? 'text-red-500' : 
                  log.severity === 'medium' ? 'text-amber-500' : 
                  'text-white/60'
                }`}>{log.event}</span>
                <span className="flex-1 font-bold text-white/40">{log.subject}</span>
                <div className="flex items-center gap-3 w-32 justify-end">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    log.status === 'OK' ? 'bg-emerald-500' : 
                    log.status === 'BLOCKED' ? 'bg-red-500' : 
                    'bg-amber-500'
                  }`} />
                  <span className={
                    log.status === 'OK' ? 'text-emerald-500' : 
                    log.status === 'BLOCKED' ? 'text-red-500' : 
                    'text-amber-500'
                  }>{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="p-10 bg-white/5 border border-white/10 rounded-[40px]">
            <h4 className="text-xl font-display uppercase tracking-tighter mb-6">Security Protocols</h4>
            <div className="space-y-4">
              {[
                { label: 'Multi-Factor Authentication', status: 'Enforced' },
                { label: 'Data Encryption (AES-256)', status: 'Active' },
                { label: 'Intrusion Detection System', status: 'Monitoring' },
                { label: 'Automated Backups', status: 'Daily' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-xs font-mono text-white/60 uppercase tracking-widest">{p.label}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-10 bg-white/5 border border-white/10 rounded-[40px]">
            <h4 className="text-xl font-display uppercase tracking-tighter mb-6">Resource Allocation</h4>
            <div className="space-y-4">
              {[
                { label: 'Compute Engine', value: '42%' },
                { label: 'Cloud Firestore', value: '18%' },
                { label: 'Cloud Storage', value: '64%' },
                { label: 'Network Bandwidth', value: '12%' },
              ].map((r, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <span>{r.label}</span>
                    <span>{r.value}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500/40 rounded-full" style={{ width: r.value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
