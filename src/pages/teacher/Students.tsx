import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  BarChart3, 
  ShieldAlert, 
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Mail,
  GraduationCap
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Table from '@/src/components/Table';
import StatCard from '@/src/components/StatCard';

export default function Students() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'submissions'),
      where('teacherId', '==', user.uid),
      orderBy('submittedAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredSubmissions = submissions.filter(s => 
    s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.testTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalStudents: new Set(submissions.map(s => s.studentId)).size,
    avgAccuracy: submissions.length > 0 
      ? Math.round(submissions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / submissions.length) + "%"
      : "0%",
    topPerformers: submissions.filter(s => (s.accuracy || 0) >= 90).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
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
          title="Student Performance" 
          subtitle="Analyze and monitor student benchmarks across your tests" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'} 
          userColor="bg-indigo-500" 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <StatCard label="Unique Students" value={stats.totalStudents.toString()} icon={Users} color="text-indigo-400" bg="bg-indigo-400/20" />
          <StatCard label="Avg. Accuracy" value={stats.avgAccuracy} icon={BarChart3} color="text-emerald-400" bg="bg-emerald-400/20" trend="2.4" trendUp />
          <StatCard label="Top Performers (90%+)" value={stats.topPerformers.toString()} icon={GraduationCap} color="text-blue-400" bg="bg-blue-400/20" />
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text"
              placeholder="Search students or tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-6 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          
          <button className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-white/5 border border-white/10 text-white font-display uppercase tracking-tighter text-xl rounded-2xl hover:bg-white/10 transition-all active:scale-95">
            <Download className="w-6 h-6" />
            Export Data
          </button>
        </div>

        <Table 
          title="Recent Submissions"
          data={filteredSubmissions}
          columns={[
            { 
              header: 'Student', 
              accessor: (item) => (
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-display text-2xl">
                    {item.studentName?.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-2xl font-display uppercase tracking-tighter mb-1">{item.studentName}</div>
                    <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {item.studentEmail}
                    </div>
                  </div>
                </div>
              )
            },
            { 
              header: 'Assessment', 
              accessor: (item) => (
                <div>
                  <div className="text-xl font-display uppercase tracking-tighter mb-1">{item.testTitle}</div>
                  <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">
                    {item.submittedAt?.toDate ? item.submittedAt.toDate().toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              )
            },
            { 
              header: 'Accuracy', 
              accessor: (item) => (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.accuracy >= 80 ? 'bg-emerald-500' : item.accuracy >= 60 ? 'bg-indigo-500' : 'bg-red-500'}`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                  <span className={`text-xl font-display tracking-tighter ${item.accuracy >= 80 ? 'text-emerald-400' : item.accuracy >= 60 ? 'text-indigo-400' : 'text-red-400'}`}>
                    {item.accuracy}%
                  </span>
                </div>
              )
            },
            { 
              header: 'Actions', 
              accessor: (item) => (
                <button 
                  onClick={() => navigate(`/results/${item.testId}`)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                  title="View Detailed Result"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              )
            }
          ]}
        />
      </main>
    </div>
  );
}
