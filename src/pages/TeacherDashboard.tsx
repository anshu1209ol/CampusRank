import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Plus, 
  FileText, 
  ShieldAlert, 
  BarChart3, 
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import StatCard from '@/src/components/StatCard';
import ChartContainer from '@/src/components/ChartContainer';
import Table from '@/src/components/Table';

const sidebarItems = [
  { icon: BarChart3, label: 'Overview', href: '/teacher' },
  { icon: FileText, label: 'Manage Tests', href: '/teacher/tests' },
  { icon: Database, label: 'Import Dataset', href: '/teacher/import' },
  { icon: Users, label: 'Students', href: '/teacher/students' },
  { icon: ShieldAlert, label: 'Cheating Alerts', href: '/teacher/alerts' },
];

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Tests created by this teacher
    const testsQuery = query(
      collection(db, 'tests'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTests(data);
      setLoading(false);
    });

    // 2. Fetch Submissions for this teacher's tests
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('teacherId', '==', user.uid),
      orderBy('submittedAt', 'desc'),
      limit(50)
    );

    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    });

    // 3. Fetch Alerts for this teacher's tests
    const alertsQuery = query(
      collection(db, 'alerts'),
      where('teacherId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(data);
    });

    return () => {
      unsubscribeTests();
      unsubscribeSubmissions();
      unsubscribeAlerts();
    };
  }, [user]);

  const stats = {
    avgScore: submissions.length > 0 
      ? Math.round(submissions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / submissions.length) + "%"
      : "0%",
    activeExams: tests.length,
    alertsCount: alerts.length
  };

  const topicPerformance = tests.map(t => ({
    topic: t.title,
    avg: submissions.filter(s => s.testId === t.id).reduce((acc, s, _, arr) => acc + (s.accuracy || 0) / arr.length, 0) || 0
  })).slice(0, 5);

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
        items={sidebarItems} 
        logoIcon={BarChart3} 
        logoColor="bg-indigo-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <Header 
          title="Teacher Dashboard" 
          subtitle={profile?.college ? `Monitoring ${profile.college}` : "Welcome to your teaching hub"} 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'} 
          userColor="bg-indigo-500" 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <StatCard label="Avg. Class Accuracy" value={stats.avgScore} icon={BarChart3} color="text-indigo-400" bg="bg-indigo-400/20" trend="4.2" trendUp />
          <StatCard label="Total Tests" value={stats.activeExams.toString()} icon={FileText} color="text-blue-400" bg="bg-blue-400/20" />
          <StatCard label="Recent Alerts" value={stats.alertsCount.toString()} icon={ShieldAlert} color="text-red-400" bg="bg-red-400/20" trend="3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <ChartContainer 
            title="Assessment Performance" 
            subtitle="Average accuracy across your created tests"
          >
            <div className="h-[400px] w-full">
              {topicPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicPerformance} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis 
                      dataKey="topic" 
                      type="category" 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      width={120} 
                      tick={{ fill: '#ffffff40', fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }} 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '24px', padding: '16px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="avg" radius={[0, 20, 20, 0]} barSize={32} animationDuration={1500}>
                      {topicPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avg > 75 ? '#10b981' : entry.avg > 65 ? '#6366f1' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/20 font-mono text-xs uppercase tracking-widest italic">
                  Create tests to see performance analytics
                </div>
              )}
            </div>
          </ChartContainer>

          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-display uppercase tracking-tighter">Cheating Alerts</h2>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="space-y-6">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-8 bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
                    <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform`}>
                        <AlertTriangle className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-display uppercase tracking-tighter text-xl">{alert.studentName || 'Unknown Student'}</h4>
                        <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-1">{alert.type === 'tab_switch' ? 'Tab Switch' : alert.type} • {alert.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-white/20 font-bold uppercase tracking-[0.2em] mb-3">
                        {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                      </div>
                      <button className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Review Incident</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 bg-white/5 border border-white/10 rounded-[48px] text-center text-white/20 font-mono text-xs uppercase tracking-widest italic">
                  No alerts detected in recent submissions
                </div>
              )}
            </div>
          </div>
        </div>

        <Table 
          title="Recent Assessments"
          data={tests.slice(0, 5)}
          columns={[
            { header: 'Test Title', accessor: (item) => <div className="font-display uppercase tracking-tighter text-xl group-hover:text-indigo-400 transition-colors">{item.title}</div> },
            { header: 'Category', accessor: (item) => <span className="text-xs font-mono uppercase tracking-widest text-white/40">{item.category}</span> },
            { header: 'Duration', accessor: (item) => <span className="text-xs font-mono uppercase tracking-widest text-white/40">{item.duration} mins</span> },
            { header: 'Created At', accessor: (item) => <span className="text-xs font-mono uppercase tracking-widest text-white/20">{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}</span> },
          ]}
          actions={
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/teacher/tests')}
                className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-display uppercase tracking-tighter text-xl rounded-[24px] hover:bg-white/10 transition-all active:scale-95"
              >
                <FileText className="w-6 h-6" />
                Manage All
              </button>
              <button 
                onClick={() => navigate('/teacher/create-test')}
                className="flex items-center gap-3 px-8 py-4 bg-white text-black font-display uppercase tracking-tighter text-xl rounded-[24px] hover:scale-105 transition-all shadow-2xl active:scale-95"
              >
                <Plus className="w-6 h-6" />
                New Test
              </button>
            </div>
          }
        />
      </main>
    </div>
  );
}
