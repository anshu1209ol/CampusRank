import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users, 
  Building2, 
  Loader2,
  Crown,
  Zap,
  Award,
  X,
  Code2,
  CheckCircle2,
  BookOpen,
  Flame,
  Target,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Award, label: 'My Certificates', href: '/certificates' },
  { icon: Code2, label: 'Problems', href: '/student/problems' },
];

// ── Demo solved questions per student (demo profiles) ──
const DEMO_SOLVED: Record<string, { question: string; difficulty: string; points: number; language: string; date: string }[]> = {
  demo_1: [
    { question: 'Two Sum', difficulty: 'Easy', points: 150, language: 'Python', date: '2026-04-03' },
    { question: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', points: 300, language: 'Python', date: '2026-04-02' },
    { question: 'Merge K Sorted Lists', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-04-01' },
    { question: 'Binary Tree Level Order Traversal', difficulty: 'Medium', points: 300, language: 'Python', date: '2026-03-31' },
    { question: 'Valid Parentheses', difficulty: 'Easy', points: 150, language: 'Java', date: '2026-03-30' },
    { question: 'Median of Two Sorted Arrays', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-03-29' },
    { question: 'LRU Cache', difficulty: 'Hard', points: 500, language: 'Python', date: '2026-03-28' },
    { question: 'Reverse Linked List', difficulty: 'Easy', points: 150, language: 'Java', date: '2026-03-27' },
    { question: 'Word Search II', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-03-26' },
    { question: 'Maximum Subarray', difficulty: 'Medium', points: 300, language: 'Python', date: '2026-03-25' },
    { question: 'House Robber', difficulty: 'Medium', points: 300, language: 'Python', date: '2026-03-24' },
    { question: 'Trapping Rain Water', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-03-23' },
    { question: 'Climbing Stairs', difficulty: 'Easy', points: 150, language: 'Java', date: '2026-03-22' },
    { question: 'Container With Most Water', difficulty: 'Medium', points: 320, language: 'Python', date: '2026-03-21' },
  ],
  demo_2: [
    { question: 'Two Sum', difficulty: 'Easy', points: 150, language: 'Java', date: '2026-04-02' },
    { question: 'Add Two Numbers', difficulty: 'Medium', points: 300, language: 'Java', date: '2026-04-01' },
    { question: 'Longest Palindromic Substring', difficulty: 'Medium', points: 300, language: 'Java', date: '2026-03-31' },
    { question: 'Regular Expression Matching', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-03-30' },
    { question: '3Sum', difficulty: 'Medium', points: 300, language: 'Java', date: '2026-03-29' },
    { question: 'Generate Parentheses', difficulty: 'Medium', points: 300, language: 'Java', date: '2026-03-28' },
    { question: 'Merge Intervals', difficulty: 'Medium', points: 300, language: 'Python', date: '2026-03-27' },
    { question: 'Course Schedule', difficulty: 'Medium', points: 300, language: 'Java', date: '2026-03-26' },
    { question: 'Word Break', difficulty: 'Medium', points: 300, language: 'Java', date: '2026-03-25' },
    { question: 'Coin Change', difficulty: 'Medium', points: 300, language: 'Python', date: '2026-03-24' },
    { question: 'Number of Islands', difficulty: 'Medium', points: 300, language: 'Java', date: '2026-03-23' },
    { question: 'Valid Anagram', difficulty: 'Easy', points: 150, language: 'Python', date: '2026-03-22' },
  ],
  demo_3: [
    { question: 'Two Sum', difficulty: 'Easy', points: 150, language: 'C++', date: '2026-04-01' },
    { question: 'Reverse Linked List', difficulty: 'Easy', points: 150, language: 'C++', date: '2026-03-31' },
    { question: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-03-30' },
    { question: 'Find Median from Data Stream', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-03-29' },
    { question: 'Minimum Window Substring', difficulty: 'Hard', points: 500, language: 'C++', date: '2026-03-28' },
    { question: 'Product of Array Except Self', difficulty: 'Medium', points: 300, language: 'C++', date: '2026-03-27' },
    { question: 'Group Anagrams', difficulty: 'Medium', points: 300, language: 'C++', date: '2026-03-26' },
    { question: 'Top K Frequent Elements', difficulty: 'Medium', points: 300, language: 'C++', date: '2026-03-25' },
    { question: 'Decode Ways', difficulty: 'Medium', points: 300, language: 'C++', date: '2026-03-24' },
    { question: 'Palindrome Partitioning', difficulty: 'Medium', points: 300, language: 'C++', date: '2026-03-23' },
    { question: 'Set Matrix Zeroes', difficulty: 'Medium', points: 300, language: 'C++', date: '2026-03-22' },
  ],
};

// Generate generic solved questions for any student without specific data
function generateSolvedForStudent(name: string, totalPoints: number): typeof DEMO_SOLVED['demo_1'] {
  const questions = [
    'Two Sum', 'Valid Parentheses', 'Merge Two Sorted Lists', 'Best Time to Buy Sell Stock',
    'Maximum Subarray', 'Climbing Stairs', 'Binary Search', 'Reverse Linked List',
    'Linked List Cycle', 'Invert Binary Tree', 'Longest Common Prefix', 'Roman to Integer',
    'Longest Substring Without Repeating', 'Add Two Numbers', '3Sum', 'Container With Most Water',
    'Letter Combinations', 'Search in Rotated Array', 'Combination Sum', 'Jump Game',
    'Merge K Sorted Lists', 'Trapping Rain Water', 'Median of Two Sorted Arrays', 'LRU Cache',
  ];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const languages = ['Python', 'Java', 'C++', 'JavaScript'];
  const result = [];
  let remaining = totalPoints;
  let idx = 0;

  while (remaining > 0 && idx < questions.length) {
    const diff = difficulties[Math.min(Math.floor(idx / 8), 2)];
    const pts = diff === 'Easy' ? 150 : diff === 'Medium' ? 300 : 500;
    if (remaining >= pts) {
      result.push({
        question: questions[idx],
        difficulty: diff,
        points: pts,
        language: languages[idx % languages.length],
        date: new Date(Date.now() - idx * 86400000).toISOString().slice(0, 10),
      });
      remaining -= pts;
    }
    idx++;
  }
  return result;
}

// Demo leaderboard entries — always displayed
const DEMO_LEADERS = [
  { id: 'demo_1', studentName: 'Arjun Mehta', college: 'IIT Delhi', totalPoints: 4820, lastUpdated: '2026-04-03T10:00:00Z', testsCompleted: 14, accuracy: 94, streak: 12 },
  { id: 'demo_2', studentName: 'Priya Sharma', college: 'NIT Trichy', totalPoints: 4350, lastUpdated: '2026-04-02T14:30:00Z', testsCompleted: 12, accuracy: 91, streak: 8 },
  { id: 'demo_3', studentName: 'Ravi Kumar', college: 'BITS Pilani', totalPoints: 3980, lastUpdated: '2026-04-01T09:15:00Z', testsCompleted: 11, accuracy: 88, streak: 15 },
  { id: 'demo_4', studentName: 'Sneha Patel', college: 'IIT Bombay', totalPoints: 3740, lastUpdated: '2026-03-31T16:45:00Z', testsCompleted: 10, accuracy: 85, streak: 6 },
  { id: 'demo_5', studentName: 'Karthik Rajan', college: 'VIT Vellore', totalPoints: 3520, lastUpdated: '2026-03-30T11:20:00Z', testsCompleted: 9, accuracy: 82, streak: 10 },
  { id: 'demo_6', studentName: 'Ananya Gupta', college: 'IIT Kanpur', totalPoints: 3310, lastUpdated: '2026-03-29T08:00:00Z', testsCompleted: 8, accuracy: 80, streak: 7 },
  { id: 'demo_7', studentName: 'Vikram Singh', college: 'DTU Delhi', totalPoints: 3100, lastUpdated: '2026-03-28T13:10:00Z', testsCompleted: 8, accuracy: 79, streak: 5 },
  { id: 'demo_8', studentName: 'Divya Nair', college: 'NIT Warangal', totalPoints: 2890, lastUpdated: '2026-03-27T17:30:00Z', testsCompleted: 7, accuracy: 77, streak: 9 },
  { id: 'demo_9', studentName: 'Rohit Joshi', college: 'IIIT Hyderabad', totalPoints: 2650, lastUpdated: '2026-03-26T10:50:00Z', testsCompleted: 7, accuracy: 75, streak: 4 },
  { id: 'demo_10', studentName: 'Meera Iyer', college: 'IIT Madras', totalPoints: 2480, lastUpdated: '2026-03-25T15:00:00Z', testsCompleted: 6, accuracy: 73, streak: 11 },
  { id: 'demo_11', studentName: 'Aditya Verma', college: 'NSIT Delhi', totalPoints: 2210, lastUpdated: '2026-03-24T12:00:00Z', testsCompleted: 6, accuracy: 70, streak: 3 },
  { id: 'demo_12', studentName: 'Pooja Reddy', college: 'SRM Chennai', totalPoints: 1990, lastUpdated: '2026-03-23T09:30:00Z', testsCompleted: 5, accuracy: 68, streak: 6 },
  { id: 'demo_13', studentName: 'Siddharth Rao', college: 'MNNIT Allahabad', totalPoints: 1780, lastUpdated: '2026-03-22T14:15:00Z', testsCompleted: 5, accuracy: 65, streak: 2 },
  { id: 'demo_14', studentName: 'Neha Bansal', college: 'PEC Chandigarh', totalPoints: 1540, lastUpdated: '2026-03-21T11:45:00Z', testsCompleted: 4, accuracy: 62, streak: 4 },
  { id: 'demo_15', studentName: 'Amit Tiwari', college: 'LNMIIT Jaipur', totalPoints: 1320, lastUpdated: '2026-03-20T16:20:00Z', testsCompleted: 4, accuracy: 60, streak: 1 },
];

// ── Difficulty color helper ──
function diffColor(diff: string) {
  if (diff === 'Easy') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (diff === 'Medium') return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  return 'text-red-400 bg-red-400/10 border-red-400/20';
}

function langColor(lang: string) {
  if (lang === 'Python') return 'text-blue-400';
  if (lang === 'Java') return 'text-orange-400';
  if (lang === 'C++') return 'text-violet-400';
  return 'text-emerald-400';
}

// ── Profile Panel Component ──
function ProfilePanel({ student, onClose }: { student: any; onClose: () => void }) {
  const solved = DEMO_SOLVED[student.id] || generateSolvedForStudent(student.studentName, student.totalPoints);
  const easyCount = solved.filter(s => s.difficulty === 'Easy').length;
  const mediumCount = solved.filter(s => s.difficulty === 'Medium').length;
  const hardCount = solved.filter(s => s.difficulty === 'Hard').length;
  const totalFromQuestions = solved.reduce((a, s) => a + s.points, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all z-10 group"
        >
          <X className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
        </button>

        {/* Header */}
        <div className="p-10 pb-0">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-amber-500/30 flex items-center justify-center text-3xl font-display text-amber-400">
              {student.studentName.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-3xl font-display uppercase tracking-tighter">{student.studentName}</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.2em]">
                <Building2 className="w-3.5 h-3.5 text-amber-500/40" />
                {student.college}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-4xl font-display text-amber-500 tracking-tighter">#{student.rank}</div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Global Rank</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Points</span>
              </div>
              <div className="text-2xl font-display tracking-tighter">{student.totalPoints.toLocaleString()}</div>
            </div>
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Solved</span>
              </div>
              <div className="text-2xl font-display tracking-tighter">{solved.length}</div>
            </div>
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Accuracy</span>
              </div>
              <div className="text-2xl font-display tracking-tighter">{student.accuracy || 85}%</div>
            </div>
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Streak</span>
              </div>
              <div className="text-2xl font-display tracking-tighter">{student.streak || 5} days</div>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 font-bold">{easyCount} Easy</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-mono text-amber-400 font-bold">{mediumCount} Medium</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-400/10 border border-red-400/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-mono text-red-400 font-bold">{hardCount} Hard</span>
            </div>
          </div>

          {/* Section Title */}
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-white/20" />
            <h3 className="text-xl font-display uppercase tracking-tighter text-white/60">Point Breakdown — Questions Solved</h3>
          </div>
        </div>

        {/* Questions List */}
        <div className="px-10 pb-10">
          <div className="space-y-3">
            {solved.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all group"
              >
                {/* Index */}
                <div className="w-8 text-center text-sm font-display text-white/15">{i + 1}</div>

                {/* Check icon */}
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>

                {/* Question Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors">{q.question}</div>
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{q.date}</div>
                </div>

                {/* Difficulty */}
                <span className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest border ${diffColor(q.difficulty)}`}>
                  {q.difficulty}
                </span>

                {/* Language */}
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${langColor(q.language)}`}>
                  {q.language}
                </span>

                {/* Points */}
                <div className="flex items-center gap-1.5 min-w-[70px] justify-end">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-sm font-display text-amber-400">+{q.points}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-mono font-bold text-white/40 uppercase tracking-widest">Total Points from solved questions</span>
            <span className="text-2xl font-display text-amber-400 tracking-tighter">{totalFromQuestions.toLocaleString()} PTS</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PodiumCard Component ──
function PodiumCard({ student, rank, color, iconColor, IconComp, size }: {
  student: any; rank: number; color: string; iconColor: string; IconComp: any; size: 'lg' | 'sm';
}) {
  const isLg = size === 'lg';
  return (
    <div className={`relative bg-white/${isLg ? '10' : '5'} border ${color} ${isLg ? 'rounded-[56px] p-12 -translate-y-10 shadow-2xl' : 'rounded-[48px] p-10'} text-center flex flex-col items-center cursor-pointer hover:scale-[1.02] transition-all duration-300`}>
      <div className={`${isLg ? 'w-32 h-32 mb-8' : 'w-24 h-24 mb-6'} rounded-full bg-${iconColor}/20 border border-${iconColor}/30 flex items-center justify-center relative`}>
        <IconComp className={`${isLg ? 'w-16 h-16' : 'w-12 h-12'} text-${iconColor}`} />
        <div className={`absolute ${isLg ? '-top-3 -right-3 w-12 h-12 text-2xl' : '-top-2 -right-2 w-10 h-10 text-xl'} rounded-full bg-${iconColor} text-black font-display flex items-center justify-center`}>{rank}</div>
      </div>
      <h3 className={`${isLg ? 'text-4xl mb-2' : 'text-3xl mb-2'} font-display uppercase tracking-tighter`}>{student.studentName}</h3>
      <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-2">{student.college}</p>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" />
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{student.testsCompleted || '?'} solved</span>
      </div>
      <div className={`${isLg ? 'text-6xl' : 'text-4xl'} font-display tracking-tighter`} style={{ color: `var(--${iconColor})` }}>
        {student.totalPoints.toLocaleString()} PTS
      </div>
    </div>
  );
}

// ── Main Component ──
export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchLeaderboard = async () => {
      try {
        const submissionsSnap = await getDocs(collection(db, 'submissions'));

        const studentStats: Record<string, {
          id: string, studentName: string, college: string, totalPoints: number,
          lastUpdated: string, testsCompleted: number, accuracy: number, streak: number
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
              lastUpdated: new Date().toISOString(),
              testsCompleted: 0,
              accuracy: 0,
              streak: 0,
            };
          }
          studentStats[studentId].totalPoints += (data.score || 0) * 10;
          studentStats[studentId].testsCompleted += 1;
        });

        const realLeaders = Object.values(studentStats).sort((a, b) => b.totalPoints - a.totalPoints);

        // Always merge with demo data to fill the board
        // Avoid duplicate IDs by filtering demo entries whose names aren't already represented
        const realNames = new Set(realLeaders.map(r => r.studentName.toLowerCase()));
        const filteredDemo = DEMO_LEADERS.filter(d => !realNames.has(d.studentName.toLowerCase()));
        const combined = [...realLeaders, ...filteredDemo]
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        setLeaders(combined.slice(0, 50));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLeaders(DEMO_LEADERS.map((item, index) => ({ ...item, rank: index + 1 })));
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
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-amber-500/30">
      <Sidebar items={sidebarItems} logoIcon={Trophy} logoColor="bg-amber-600" />

      <main className="flex-1 overflow-y-auto p-10 lg:p-20 relative">
        <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

        <Header
          title="Global Rankings"
          subtitle="The elite circle of SkillForge top performers — click any student to see their profile"
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}
          userColor="bg-amber-500"
        />

        {/* ── Podium ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 items-end">
          {/* Silver #2 */}
          {topThree[1] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative group cursor-pointer" onClick={() => setSelectedStudent(topThree[1])}
            >
              <div className="absolute -inset-1 bg-gradient-to-t from-slate-400/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/5 border border-white/10 rounded-[48px] p-10 text-center flex flex-col items-center hover:border-slate-400/30 transition-all">
                <div className="w-24 h-24 rounded-full bg-slate-400/20 border border-slate-400/30 flex items-center justify-center mb-6 relative">
                  <Medal className="w-12 h-12 text-slate-400" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-slate-400 text-black font-display text-xl flex items-center justify-center">2</div>
                </div>
                <h3 className="text-3xl font-display uppercase tracking-tighter mb-2">{topThree[1].studentName}</h3>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-2">{topThree[1].college}</p>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{topThree[1].testsCompleted || 12} solved</span>
                </div>
                <div className="text-4xl font-display text-slate-400 tracking-tighter">{topThree[1].totalPoints.toLocaleString()} PTS</div>
                <div className="mt-4 text-[9px] font-mono text-white/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to view profile →</div>
              </div>
            </motion.div>
          )}

          {/* Gold #1 */}
          {topThree[0] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative group cursor-pointer" onClick={() => setSelectedStudent(topThree[0])}
            >
              <div className="absolute -inset-2 bg-gradient-to-t from-amber-500/30 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 border border-amber-500/30 rounded-[56px] p-12 text-center flex flex-col items-center transform -translate-y-10 shadow-2xl shadow-amber-500/10 hover:border-amber-500/60 transition-all">
                <div className="w-32 h-32 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-8 relative">
                  <Crown className="w-16 h-16 text-amber-500" />
                  <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-amber-500 text-black font-display text-2xl flex items-center justify-center">1</div>
                </div>
                <h3 className="text-4xl font-display uppercase tracking-tighter mb-2">{topThree[0].studentName}</h3>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-2">{topThree[0].college}</p>
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{topThree[0].testsCompleted || 14} solved</span>
                </div>
                <div className="text-6xl font-display text-amber-500 tracking-tighter">{topThree[0].totalPoints.toLocaleString()} PTS</div>
                <div className="mt-6 text-[9px] font-mono text-white/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to view profile →</div>
              </div>
            </motion.div>
          )}

          {/* Bronze #3 */}
          {topThree[2] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="relative group cursor-pointer" onClick={() => setSelectedStudent(topThree[2])}
            >
              <div className="absolute -inset-1 bg-gradient-to-t from-orange-400/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/5 border border-white/10 rounded-[48px] p-10 text-center flex flex-col items-center hover:border-orange-400/30 transition-all">
                <div className="w-24 h-24 rounded-full bg-orange-400/20 border border-orange-400/30 flex items-center justify-center mb-6 relative">
                  <Award className="w-12 h-12 text-orange-400" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-orange-400 text-black font-display text-xl flex items-center justify-center">3</div>
                </div>
                <h3 className="text-3xl font-display uppercase tracking-tighter mb-2">{topThree[2].studentName}</h3>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-2">{topThree[2].college}</p>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{topThree[2].testsCompleted || 11} solved</span>
                </div>
                <div className="text-4xl font-display text-orange-400 tracking-tighter">{topThree[2].totalPoints.toLocaleString()} PTS</div>
                <div className="mt-4 text-[9px] font-mono text-white/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to view profile →</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Full Rankings List (custom, no Table component) ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-white/5 border border-white/10 rounded-[48px] overflow-hidden shadow-2xl backdrop-blur-xl"
        >
          <div className="p-10 border-b border-white/10">
            <h2 className="text-4xl font-display uppercase tracking-tighter mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">Elite Performers</h2>
            <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.2em]">Click any row to see full profile • {rest.length} Records</p>
          </div>

          <div className="divide-y divide-white/5">
            {rest.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedStudent(student)}
                className="flex items-center gap-6 px-10 py-6 hover:bg-white/[0.04] cursor-pointer transition-all duration-300 group"
              >
                {/* Rank */}
                <div className="w-12 text-3xl font-display text-white/15 tracking-tighter">#{student.rank}</div>

                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-display text-lg text-white/30 group-hover:border-amber-500/30 group-hover:text-amber-400 transition-all flex-shrink-0">
                  {student.studentName.split(' ').map((n: string) => n[0]).join('')}
                </div>

                {/* Name & College */}
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-display uppercase tracking-tighter mb-0.5 group-hover:text-amber-400 transition-colors truncate">{student.studentName}</div>
                  <div className="text-[10px] font-mono font-bold text-white/20 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <Building2 className="w-3.5 h-3.5 text-amber-500/40" />
                    {student.college}
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500/60" />
                  <span className="text-lg font-display tracking-tight text-white/60">{student.totalPoints.toLocaleString()}</span>
                  <span className="text-[10px] font-mono text-white/20">PTS</span>
                </div>

                {/* Solved count */}
                <div className="hidden md:flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{student.testsCompleted || '—'} solved</span>
                </div>

                {/* Accuracy */}
                <div className="hidden lg:flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500/40" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{student.accuracy || '—'}% acc</span>
                </div>

                {/* Arrow hint */}
                <div className="text-white/10 group-hover:text-white/40 transition-colors text-sm">→</div>
              </motion.div>
            ))}
          </div>

          <div className="p-10 border-t border-white/10 text-center">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Showing {rest.length} of {leaders.length} ranked students</span>
          </div>
        </motion.div>
      </main>

      {/* ── Profile Panel Modal ── */}
      <AnimatePresence>
        {selectedStudent && (
          <ProfilePanel student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
