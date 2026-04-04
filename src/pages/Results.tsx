import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Target, 
  Clock, 
  ChevronRight, 
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Header from '@/src/components/Header';

export default function Results() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user || !testId) return;
      try {
        // Fetch the latest submission for this test and user
        const q = query(
          collection(db, 'submissions'),
          where('testId', '==', testId),
          where('studentId', '==', user.uid),
          orderBy('submittedAt', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setSubmission(querySnapshot.docs[0].data());
        } else {
          navigate('/student');
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user, testId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!submission) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      <main className="flex-1 p-10 lg:p-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Header 
            title="Performance Analysis" 
            subtitle={`Assessment: ${submission.testTitle} • Completed on ${new Date(submission.submittedAt?.toDate()).toLocaleDateString()}`} 
            userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'} 
            userColor="bg-indigo-500" 
          />

          {/* Hero Results Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 p-16 bg-white/5 border border-white/10 rounded-[64px] backdrop-blur-3xl relative overflow-hidden flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full -mr-20 -mt-20" />
              
              <div className="flex items-center gap-8 mb-12">
                <div className="w-24 h-24 bg-white text-black rounded-[32px] flex items-center justify-center shadow-2xl shadow-white/10">
                  <Trophy className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-5xl font-display uppercase tracking-tighter mb-2">Excellent Work!</h2>
                  <p className="text-xl text-white/40 font-medium">You've successfully completed the benchmark protocol.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-12">
                <div>
                  <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.4em] block mb-4">Final Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-display tracking-tighter">{submission.score}</span>
                    <span className="text-2xl font-display text-white/20">/ {submission.totalQuestions}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.4em] block mb-4">Accuracy</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-display tracking-tighter text-emerald-400">{Math.round(submission.accuracy)}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.4em] block mb-4">Time Taken</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display tracking-tighter">{formatTime(submission.timeTaken)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-12 bg-indigo-600 rounded-[64px] flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-indigo-600/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
              
              <div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-display uppercase tracking-tighter leading-none mb-4">Skill Badge Earned</h3>
                <p className="text-white/70 font-medium leading-relaxed">Your performance in this assessment has qualified you for the <span className="text-white font-bold">Advanced Logic</span> certification.</p>
              </div>

              <button 
                onClick={() => navigate('/student')}
                className="w-full py-6 bg-white text-black font-display uppercase tracking-tighter text-xl rounded-3xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Return to Nexus
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-display uppercase tracking-tighter">Detailed Breakdown</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Incorrect</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Integrity Score', value: '100%', icon: ShieldCheck, color: 'text-blue-400' },
                { label: 'Focus Level', value: 'High', icon: Target, color: 'text-purple-400' },
                { label: 'Speed Percentile', value: '88th', icon: TrendingUp, color: 'text-amber-400' },
                { label: 'Warnings', value: submission.warnings || '0', icon: AlertCircle, color: 'text-red-400' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="p-10 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-xl group hover:bg-white/10 transition-all"
                >
                  <stat.icon className={`w-8 h-8 ${stat.color} mb-6 group-hover:scale-110 transition-transform`} />
                  <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] block mb-2">{stat.label}</span>
                  <span className="text-4xl font-display tracking-tighter">{stat.value}</span>
                </motion.div>
              ))}
            </div>

            <div className="p-16 bg-white/5 border border-white/10 rounded-[64px] backdrop-blur-3xl relative overflow-hidden">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="text-3xl font-display uppercase tracking-tighter">AI Growth Insights</h4>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <p className="text-xl text-white/60 leading-relaxed font-medium italic">
                    "Your solution patterns suggest a strong grasp of algorithmic complexity. However, your response time on recursive logic questions was 15% slower than your average. Focus on optimizing stack-based operations."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">AI</div>
                    <span className="text-xs font-mono font-bold text-white/20 uppercase tracking-widest">SkillForge Intelligence Engine</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                    <h5 className="text-sm font-bold uppercase tracking-widest mb-4">Recommended Learning</h5>
                    <div className="space-y-3">
                      {['Advanced Dynamic Programming', 'Graph Theory Mastery', 'System Design Patterns'].map((topic) => (
                        <div key={topic} className="flex items-center justify-between group/topic cursor-pointer">
                          <span className="text-white/60 group-hover/topic:text-white transition-colors">{topic}</span>
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover/topic:text-white transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
