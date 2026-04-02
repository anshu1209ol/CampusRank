import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Users, 
  Building2, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  MoreVertical,
  ShieldCheck,
  AlertOctagon,
  UserCheck,
  UserX,
  LayoutDashboard,
  Activity,
  Server,
  Database,
  UserPlus,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import StatCard from '@/src/components/StatCard';
import Table from '@/src/components/Table';
import { toast } from 'sonner';

const sidebarItems = [
  { icon: Activity, label: 'System Overview', href: '/admin' },
  { icon: Users, label: 'User Management', href: '/admin/users' },
  { icon: Building2, label: 'Colleges', href: '/admin/colleges' },
  { icon: Shield, label: 'Security Logs', href: '/admin/security' },
];

export default function AdminPanel() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    totalSubmissions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch all users
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      setStats(prev => ({ ...prev, totalUsers: data.length }));
      setLoading(false);
    });

    // 2. Fetch global counts (simplified)
    const fetchGlobalStats = async () => {
      const testsSnap = await getDocs(collection(db, 'tests'));
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      setStats(prev => ({
        ...prev,
        totalTests: testsSnap.size,
        totalSubmissions: submissionsSnap.size
      }));
    };
    fetchGlobalStats();

    return () => unsubscribeUsers();
  }, [user]);

  const systemStats = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Tests', value: stats.totalTests.toLocaleString(), icon: Database, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Submissions', value: stats.totalSubmissions.toLocaleString(), icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Security Status', value: 'Secure', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-amber-500/30">
      <Sidebar 
        items={sidebarItems} 
        logoIcon={Shield} 
        logoColor="bg-amber-600" 
      />

      <main className="flex-1 overflow-y-auto p-10 lg:p-20 relative">
        {/* Ambient Background Elements */}
        <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[30%] h-[30%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

        <Header 
          title="System Nexus" 
          subtitle={`Global Infrastructure Control • Authorized: ${profile?.name || 'Administrator'}`} 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'} 
          userColor="bg-amber-500" 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
          {systemStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="space-y-16">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Table 
              title="Recent Identity Registrations"
              data={users.slice(0, 5)}
              columns={[
                { header: 'Subject Profile', accessor: (item) => (
                  <div className="flex items-center gap-6 py-2">
                    <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center font-display text-2xl text-white/20 overflow-hidden relative group/avatar">
                      {item.photoURL ? (
                        <img src={item.photoURL} alt={item.name} className="w-full h-full object-cover grayscale group-hover/avatar:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                      ) : (
                        item.name.split(' ').map((n: string) => n[0]).join('')
                      )}
                      <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <div className="text-2xl font-display uppercase tracking-tighter group-hover:text-amber-400 transition-colors leading-none mb-2">{item.name}</div>
                      <div className="text-[10px] font-mono font-bold text-white/20 flex items-center gap-2 uppercase tracking-[0.2em]">
                        <Mail className="w-3.5 h-3.5 text-amber-500/40" />
                        {item.email}
                      </div>
                    </div>
                  </div>
                )},
                { header: 'Access Level', accessor: (item) => (
                  <div className="flex items-center">
                    <span className={`px-6 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] border ${
                      item.role === 'teacher' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 
                      item.role === 'admin' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    }`}>
                      {item.role}
                    </span>
                  </div>
                )},
                { header: 'Operational Status', accessor: (item) => (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-500/80">Active</span>
                  </div>
                )},
                { header: 'Registration Date', accessor: (item) => (
                  <div className="flex flex-col">
                    <span className="text-xl font-display text-white/80 tracking-tighter">{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-[10px] font-mono font-bold text-white/10 uppercase tracking-[0.2em]">ISO-8601 Verified</span>
                  </div>
                )},
              ]}
              actions={
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-4 px-10 py-5 bg-white/5 border border-white/10 text-white font-display uppercase tracking-tighter text-xl rounded-2xl hover:bg-white/10 transition-all shadow-2xl shadow-white/5 active:scale-95"
                  >
                    <Users className="w-6 h-6" />
                    Manage All Users
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const token = user ? await user.getIdToken() : '';
                        const res = await fetch('/api/admin/recalculate-leaderboard', { 
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        if (res.ok) toast.success('Leaderboard recalculated');
                        else toast.error('Server missing Firebase Admin Applet Credentials or Unauthorized');
                      } catch (e) {
                        toast.error('Failed to update leaderboard');
                      }
                    }}
                    className="flex items-center gap-4 px-10 py-5 bg-amber-500 text-black font-display uppercase tracking-tighter text-xl rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-amber-500/20 active:scale-95"
                  >
                    <Activity className="w-6 h-6" />
                    Sync Leaderboard
                  </button>
                </div>
              }
            />
          </div>

          {/* System Logs Placeholder */}
          <div className="p-12 bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-3xl rounded-full" />
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                  <Server className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-3xl font-display uppercase tracking-tighter">Infrastructure Logs</h3>
              </div>
              <button 
                onClick={() => navigate('/admin/security')}
                className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                View All Streams
              </button>
            </div>
            
            <div className="space-y-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
              {[
                { time: '15:24:02', event: 'AUTH_PROTOCOL_SUCCESS', subject: 'USER_8829', status: 'OK' },
                { time: '15:22:18', event: 'DATABASE_SYNC_COMPLETE', subject: 'COLLECTION_TESTS', status: 'OK' },
                { time: '15:19:45', event: 'SECURITY_ALERT_RESOLVED', subject: 'IP_192.168.1.1', status: 'MITIGATED' },
                { time: '15:15:10', event: 'SYSTEM_BACKUP_INITIATED', subject: 'REGION_US_EAST', status: 'PENDING' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-8 py-4 border-b border-white/5 last:border-0 group/log hover:bg-white/5 px-4 rounded-xl transition-colors">
                  <span className="text-amber-500/60 w-20">{log.time}</span>
                  <span className="text-white/60 w-64">{log.event}</span>
                  <span className="flex-1">{log.subject}</span>
                  <span className={log.status === 'OK' ? 'text-emerald-500' : 'text-amber-500'}>{log.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
