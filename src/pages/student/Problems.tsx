import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Code2, ChevronRight, Search, Loader2, Cpu, Zap, Trophy, Flame, CheckCircle2, LayoutDashboard, Award } from 'lucide-react';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/contexts/AuthContext';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
  { icon: Code2, label: 'Problems', href: '/student/problems' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Award, label: 'Certificates', href: '/certificates' },
];

export default function Problems() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Fetch Problems
        try {
          // Use our local proxy for the 1000-question bulk data (credentials fallback)
          const response = await fetch('/api/problems');
          if (response.ok) {
            const data = await response.json();
            setProblems(data);
          } else {
             // Fallback to Firestore if proxy fails
             const problemsQuery = query(collection(db, 'problems'));
             const snapshot = await getDocs(problemsQuery);
             const fetchedData: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             if (fetchedData.length > 0) setProblems(fetchedData);
          }
        } catch (err) {
          console.error('API fetch failed, trying Firestore:', err);
          const problemsQuery = query(collection(db, 'problems'));
          const snapshot = await getDocs(problemsQuery);
          setProblems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // 2. Fetch Solved Submissions - Needs profile for studentId
        if (profile) {
          try {
            const submissionsQuery = query(
              collection(db, 'submissions'),
              where('studentId', '==', profile.uid),
              where('accuracy', '==', 100)
            );
            const subSnapshot = await getDocs(submissionsQuery);
            const solved = new Set<string>();
            subSnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.problemId) solved.add(data.problemId);
              if (data.answers) {
                 data.answers.forEach((ans: any) => {
                   if (ans.correct) solved.add(ans.questionId);
                 });
              }
            });
            setSolvedIds(solved);
          } catch (err) {
            console.error('Error fetching submissions:', err);
          }
        }

      } catch (error) {
        console.error('Error fetching problems data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile]);

  const filteredProblems = problems.filter(p => {
    const title = p.title || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = filterDifficulty === 'All' || p.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      <Sidebar items={sidebarItems} />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <Header 
            title="Problem Forge" 
            subtitle="Master the craft of logic through elite coding challenges" 
            userInitials={profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'SF'} 
            userColor="bg-orange-500" 
          />

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Solved', value: '24', icon: Trophy, color: 'text-emerald-400' },
              { label: 'Skill Points', value: '1,250', icon: Zap, color: 'text-amber-400' },
              { label: 'Current Streak', value: '5 Days', icon: Flame, color: 'text-orange-500' },
              { label: 'Global Rank', value: '#452', icon: Cpu, color: 'text-blue-400' },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">{stat.label}</span>
                </div>
                <div className="text-2xl font-display uppercase tracking-tighter">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="text"
                placeholder="SEARCH PROBLEMS BY TITLE OR TAG..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/3 border border-white/10 rounded-[32px] pl-16 pr-8 py-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all placeholder:text-white/10 uppercase tracking-wider"
              />
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={`px-8 py-6 rounded-[32px] font-mono text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${
                    filterDifficulty === diff 
                      ? 'bg-orange-600/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10' 
                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProblems.map((problem) => (
                <motion.div 
                  key={problem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ x: 10 }}
                  onClick={() => navigate(`/student/problems/${problem.id}`)}
                  className="group bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer hover:bg-white/[0.08] hover:border-white/20 transition-all backdrop-blur-xl"
                >
                  <div className="flex items-center gap-8 flex-1">
                    <div className="w-16 h-16 rounded-3xl bg-black border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Code2 className={`w-8 h-8 ${
                        problem.difficulty === 'Easy' ? 'text-emerald-400' :
                        problem.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {solvedIds.has(problem.id) && (
                          <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-500 text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <CheckCircle2 className="w-3 h-3" />
                            SOLVED
                          </span>
                        )}
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-md ${
                          problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                          problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">{problem.category}</span>
                      </div>
                      <h3 className="text-2xl font-display uppercase tracking-tighter text-white/90 group-hover:text-white transition-colors">{problem.title}</h3>
                      <p className="text-sm text-white/40 font-medium line-clamp-1 mt-1">{problem.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 shrink-0">
                    <div className="hidden lg:flex flex-col items-end">
                      <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] mb-1">Skill Gain</span>
                      <span className="text-xl font-display text-emerald-400">+{problem.points} XP</span>
                    </div>
                    <div className="hidden lg:flex flex-col items-end">
                      <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] mb-1">Success Rate</span>
                      <span className="text-xl font-display text-white/60">{(85 + Math.random() * 10).toFixed(1)}%</span>
                    </div>
                    <button className="px-10 py-5 bg-white text-black font-display uppercase tracking-tighter text-xl rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all flex items-center gap-3 shadow-2xl">
                      Forge Now
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
