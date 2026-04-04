import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Award,
  Target,
  Zap,
  Sparkles,
  Clock,
  Loader2,
  Code2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import StatCard from '@/src/components/StatCard';
import ChartContainer from '@/src/components/ChartContainer';
import TestCard from '@/src/components/TestCard';

import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
  { icon: Code2, label: 'Problems', href: '/student/problems' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Award, label: 'Certificates', href: '/certificates' },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Submissions for stats and trends
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('studentId', '==', user.uid),
      orderBy('submittedAt', 'desc'),
      limit(10)
    );

    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    });

    // 2. Fetch Upcoming Tests
    const testsQuery = query(
      collection(db, 'tests'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingTests(data);
      setLoading(false);
    });

    return () => {
      unsubscribeSubmissions();
      unsubscribeTests();
    };
  }, [user]);

  const stats = {
    percentile: submissions.length > 0 
      ? Math.min(99, Math.round(50 + (submissions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / submissions.length) / 2)) + "%"
      : "N/A",
    completed: submissions.length,
    accuracy: submissions.length > 0 
      ? Math.round(submissions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / submissions.length) + "%"
      : "0%",
    points: submissions.reduce((acc, s) => acc + ((s.score || 0) * 10), 0)
  };

  const performanceData = submissions.slice().reverse().map((s, i) => ({
    name: `Test ${i + 1}`,
    score: s.score || 0
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-violet-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <Sidebar 
        items={sidebarItems} 
        logoIcon={LayoutDashboard} 
        logoColor="bg-violet-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative z-10">
        <Header 
          title={`Welcome back, ${profile?.name?.split(' ')[0] || 'User'}! 👋`} 
          subtitle={profile?.college ? `Student at ${profile.college}` : "Ready to benchmark your skills?"} 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'} 
          userColor="bg-gradient-to-br from-violet-500 to-indigo-500" 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          <StatCard label="Overall Percentile" value={stats.percentile} icon={TrendingUp} color="text-emerald-400" bg="bg-emerald-400/20" trend="2.4" trendUp />
          <StatCard label="Tests Completed" value={stats.completed.toString()} icon={BookOpen} color="text-violet-400" bg="bg-violet-400/20" />
          <StatCard label="Avg. Accuracy" value={stats.accuracy} icon={Target} color="text-blue-400" bg="bg-blue-400/20" trend="1.2" trendUp />
          <StatCard label="Skill Points" value={stats.points.toLocaleString()} icon={Zap} color="text-amber-400" bg="bg-amber-400/20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <ChartContainer 
            title="Performance Trend" 
            subtitle="Your skill growth over recent tests"
            className="lg:col-span-2"
          >
            <div className="h-[400px] w-full">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#ffffff40', fontWeight: '500' }}
                    />
                    <YAxis 
                      stroke="#ffffff20" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(v) => `${v}%`} 
                      tick={{ fill: '#ffffff40', fontWeight: '500' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '24px', padding: '16px' }}
                      itemStyle={{ color: '#fff', fontWeight: '600' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8b5cf6" 
                      strokeWidth={6} 
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/20 font-mono text-xs uppercase tracking-widest italic">
                  Take your first test to see performance trends
                </div>
              )}
            </div>
          </ChartContainer>

          <div className="space-y-10" id="tests-section">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-display uppercase tracking-tighter">Upcoming Tests</h2>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white/40" />
              </div>
            </div>
            <div className="space-y-8">
              {upcomingTests.length > 0 ? (
                <>
                  {upcomingTests.slice(0, 2).map((test) => (
                    <TestCard 
                      key={test.id} 
                      id={test.id}
                      title={test.title}
                      duration={`${test.duration} mins`}
                      date={test.createdAt?.toDate ? test.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      category={test.category}
                    />
                  ))}
                  {upcomingTests.length > 2 && (
                    <button 
                      onClick={() => navigate('/student/practice')}
                      className="w-full py-6 bg-white text-black font-display uppercase tracking-tighter text-xl rounded-[32px] hover:scale-[1.02] transition-all shadow-2xl shadow-white/5 active:scale-95"
                    >
                      View All Tests
                    </button>
                  )}
                </>
              ) : (
                <div className="p-12 bg-white/5 border border-white/10 rounded-[40px] text-center text-white/20 font-mono text-xs uppercase tracking-widest">
                  No tests available at the moment
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 relative rounded-[48px] overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-900 p-12 lg:p-16 shadow-2xl shadow-violet-600/20"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
            <div className="w-24 h-24 bg-white text-violet-600 rounded-[32px] flex items-center justify-center shadow-2xl animate-pulse">
              <Sparkles className="w-12 h-12" />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/60 mb-4">AI Performance Analysis</div>
              <h3 className="text-4xl font-display uppercase tracking-tighter mb-4">Your Skill Insight</h3>
              <p className="text-white/80 text-xl leading-relaxed max-w-2xl">
                {submissions.length > 0 ? (
                  <>Based on your last {submissions.length} test{submissions.length > 1 ? 's' : ''}, your average accuracy is <span className="text-white font-semibold underline underline-offset-8 decoration-white/30">{stats.accuracy}</span>. {parseInt(stats.accuracy) >= 80 ? 'Great work! Keep pushing for excellence.' : parseInt(stats.accuracy) >= 60 ? 'Good progress! Focus on your weak areas to improve further.' : 'Keep practicing! Consistent effort will improve your scores.'}</>
                ) : (
                  <>Welcome to SkillForge! Take your first test to get personalized AI insights and recommendations.</>
                )}
              </p>
            </div>
            <button 
              onClick={() => navigate('/student/practice')}
              className="px-12 py-6 bg-black text-white font-display uppercase tracking-tighter text-2xl rounded-[32px] hover:scale-105 transition-all shadow-2xl active:scale-95"
            >
              Start Practice
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
