import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  Search, 
  Building2, 
  Loader2,
  Crown,
  Target,
  Zap,
  Award
} from 'lucide-react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Table from '@/src/components/Table';

const sidebarItems = [
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Award, label: 'My Certificates', href: '/certificates' },
  { icon: Users, label: 'Student Dashboard', href: '/student' },
];

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLeaderboard = async () => {
      try {
        // Aggregate points directly from submissions
        // This avoids needing the backend "admin" recalculated leaderboard
        // ensuring the leaderboard works in local mode without service accounts!
        const submissionsSnap = await getDocs(collection(db, 'submissions'));
        
        const studentStats: Record<string, { 
          id: string, 
          studentName: string, 
          college: string, 
          totalPoints: number,
          lastUpdated: string
        }> = {};

        submissionsSnap.forEach((doc) => {
          const data = doc.data();
          const studentId = data.studentId;
          
          if (!studentId) return;

          if (!studentStats[studentId]) {
            studentStats[studentId] = { 
              id: studentId,
              studentName: data.studentName || 'Student', 
              college: data.college || 'Unknown', 
              totalPoints: 0,
              lastUpdated: new Date().toISOString()
            };
          }
          studentStats[studentId].totalPoints += (data.score || 0) * 10;
        });

        // Convert to array and sort
        const aggregatedLeaders = Object.values(studentStats)
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .map((item, index) => ({
            ...item,
            rank: index + 1
          }));

        setLeaders(aggregatedLeaders.slice(0, 50));
      } catch (error) {
        console.error("Error fetching leaderboard directly:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  const topThree = leaders.slice(0, 3);
  const others = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-amber-500/30">
      <Sidebar 
        items={sidebarItems} 
        logoIcon={Trophy} 
        logoColor="bg-amber-600" 
      />

      <main className="flex-1 overflow-y-auto p-10 lg:p-20 relative">
        <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <Header 
          title="Global Rankings" 
          subtitle="The elite circle of CampusRank top performers" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'} 
          userColor="bg-amber-500" 
        />

        {/* Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 items-end">
          {/* Silver - Rank 2 */}
          {topThree[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-t from-slate-400/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/5 border border-white/10 rounded-[48px] p-10 text-center flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-slate-400/20 border border-slate-400/30 flex items-center justify-center mb-6 relative">
                  <Medal className="w-12 h-12 text-slate-400" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-slate-400 text-black font-display text-xl flex items-center justify-center">2</div>
                </div>
                <h3 className="text-3xl font-display uppercase tracking-tighter mb-2">{topThree[1].studentName}</h3>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-6">{topThree[1].college}</p>
                <div className="text-4xl font-display text-slate-400 tracking-tighter">{topThree[1].totalPoints.toLocaleString()} PTS</div>
              </div>
            </motion.div>
          )}

          {/* Gold - Rank 1 */}
          {topThree[0] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative group"
            >
              <div className="absolute -inset-2 bg-gradient-to-t from-amber-500/30 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 border border-amber-500/30 rounded-[56px] p-12 text-center flex flex-col items-center transform -translate-y-10 shadow-2xl shadow-amber-500/10">
                <div className="w-32 h-32 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-8 relative">
                  <Crown className="w-16 h-16 text-amber-500" />
                  <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-amber-500 text-black font-display text-2xl flex items-center justify-center">1</div>
                </div>
                <h3 className="text-4xl font-display uppercase tracking-tighter mb-2">{topThree[0].studentName}</h3>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-8">{topThree[0].college}</p>
                <div className="text-6xl font-display text-amber-500 tracking-tighter">{topThree[0].totalPoints.toLocaleString()} PTS</div>
              </div>
            </motion.div>
          )}

          {/* Bronze - Rank 3 */}
          {topThree[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-t from-orange-400/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/5 border border-white/10 rounded-[48px] p-10 text-center flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-orange-400/20 border border-orange-400/30 flex items-center justify-center mb-6 relative">
                  <Award className="w-12 h-12 text-orange-400" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-orange-400 text-black font-display text-xl flex items-center justify-center">3</div>
                </div>
                <h3 className="text-3xl font-display uppercase tracking-tighter mb-2">{topThree[2].studentName}</h3>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-6">{topThree[2].college}</p>
                <div className="text-4xl font-display text-orange-400 tracking-tighter">{topThree[2].totalPoints.toLocaleString()} PTS</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Full Rankings Table */}
        <Table 
          title="Elite Performers"
          data={others}
          columns={[
            { header: 'Rank', accessor: (item) => (
              <div className="text-3xl font-display text-white/20 tracking-tighter">#{item.rank}</div>
            )},
            { header: 'Student Profile', accessor: (item) => (
              <div className="flex items-center gap-6 py-2">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-display text-xl text-white/20">
                  {item.studentName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-2xl font-display uppercase tracking-tighter mb-1">{item.studentName}</div>
                  <div className="text-[10px] font-mono font-bold text-white/20 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <Building2 className="w-3.5 h-3.5 text-amber-500/40" />
                    {item.college}
                  </div>
                </div>
              </div>
            )},
            { header: 'Performance Stats', accessor: (item) => (
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-amber-500/60" />
                  <span className="text-lg font-display tracking-tight text-white/60">{item.totalPoints.toLocaleString()} PTS</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500/60" />
                  <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">Top 1%</span>
                </div>
              </div>
            )},
            { header: 'Last Activity', accessor: (item) => (
              <div className="text-[10px] font-mono font-bold text-white/10 uppercase tracking-[0.2em]">
                {new Date(item.lastUpdated).toLocaleDateString()}
              </div>
            )},
          ]}
        />
      </main>
    </div>
  );
}
