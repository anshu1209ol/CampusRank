import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  Users,
  Loader2,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Table from '@/src/components/Table';
import StatCard from '@/src/components/StatCard';
import { toast } from 'sonner';

export default function Alerts() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'alerts'),
      where('teacherId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredAlerts = alerts.filter(a => 
    a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.testTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'high' || a.type === 'multiple_faces').length,
    tabSwitches: alerts.filter(a => a.type === 'tab_switch').length
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to dismiss this alert?')) return;
    try {
      await deleteDoc(doc(db, 'alerts', id));
      toast.success('Alert dismissed');
    } catch (error) {
      toast.error('Failed to dismiss alert');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar 
        items={[
          { icon: BarChart3, label: 'Overview', href: '/teacher' },
          { icon: FileText, label: 'Manage Tests', href: '/teacher/tests' },
          { icon: Users, label: 'Students', href: '/teacher/students' },
          { icon: ShieldAlert, label: 'Cheating Alerts', href: '/teacher/alerts' },
        ]} 
        logoIcon={BarChart3} 
        logoColor="bg-indigo-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <Header 
          title="Integrity Monitoring" 
          subtitle="Real-time cheating detection and security alerts" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'} 
          userColor="bg-red-500" 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <StatCard label="Total Alerts" value={stats.totalAlerts.toString()} icon={ShieldAlert} color="text-red-400" bg="bg-red-400/20" />
          <StatCard label="Critical Incidents" value={stats.criticalAlerts.toString()} icon={AlertTriangle} color="text-amber-400" bg="bg-amber-400/20" />
          <StatCard label="Tab Switches" value={stats.tabSwitches.toString()} icon={Activity} color="text-blue-400" bg="bg-blue-400/20" />
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text"
              placeholder="Search alerts by student or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-6 focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-white/5 border border-white/10 text-white font-display uppercase tracking-tighter text-xl rounded-2xl hover:bg-white/10 transition-all active:scale-95">
              <Filter className="w-6 h-6" />
              Filter
            </button>
          </div>
        </div>

        <Table 
          title="Security Incident Log"
          data={filteredAlerts}
          columns={[
            { 
              header: 'Student & Test', 
              accessor: (item) => (
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-2xl font-display uppercase tracking-tighter mb-1">{item.studentName}</div>
                    <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">{item.testTitle}</div>
                  </div>
                </div>
              )
            },
            { 
              header: 'Alert Type', 
              accessor: (item) => (
                <div className="flex items-center gap-4">
                  <div className={`px-6 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] border ${
                    item.type === 'tab_switch' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 
                    item.type === 'multiple_faces' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {item.type?.replace('_', ' ')}
                  </div>
                </div>
              )
            },
            { 
              header: 'Details', 
              accessor: (item) => (
                <div className="max-w-xs">
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest leading-relaxed">{item.details}</p>
                </div>
              )
            },
            { 
              header: 'Timestamp', 
              accessor: (item) => (
                <div className="flex flex-col">
                  <span className="text-xl font-display text-white/80 tracking-tighter">
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white/10 uppercase tracking-[0.2em]">
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : ''}
                  </span>
                </div>
              )
            },
            { 
              header: 'Actions', 
              accessor: (item) => (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate(`/results/${item.testId}`)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                    title="View Submission"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-red-500"
                    title="Dismiss Alert"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              )
            }
          ]}
        />
      </main>
    </div>
  );
}
