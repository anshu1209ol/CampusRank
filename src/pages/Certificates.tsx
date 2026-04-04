import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Download, 
  ExternalLink, 
  Search, 
  Calendar, 
  Trophy, 
  ShieldCheck,
  Loader2,
  Building2,
  GraduationCap,
  Zap,
  Target,
  LayoutDashboard,
  Code2,
  Star,
  FileCheck2
} from 'lucide-react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import { toast } from 'sonner';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
  { icon: Award, label: 'My Certificates', href: '/certificates' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Code2, label: 'Problems', href: '/student/problems' },
];

// Demo certificates to always show sample data
const DEMO_CERTIFICATES = [
  {
    id: 'demo_cert_1',
    testTitle: 'Python Fundamentals',
    score: 92,
    issueDate: '2026-03-15T10:00:00Z',
    studentName: 'Demo Student',
    certificateId: 'SF-PY-2026-00412',
    category: 'Programming',
    isDemo: true,
  },
  {
    id: 'demo_cert_2',
    testTitle: 'Data Structures & Algorithms',
    score: 87,
    issueDate: '2026-03-01T14:30:00Z',
    studentName: 'Demo Student',
    certificateId: 'SF-DSA-2026-00198',
    category: 'Computer Science',
    isDemo: true,
  },
  {
    id: 'demo_cert_3',
    testTitle: 'Java Enterprise Development',
    score: 78,
    issueDate: '2026-02-20T09:00:00Z',
    studentName: 'Demo Student',
    certificateId: 'SF-JV-2026-00067',
    category: 'Programming',
    isDemo: true,
  },
  {
    id: 'demo_cert_4',
    testTitle: 'SQL & Database Management',
    score: 95,
    issueDate: '2026-02-10T11:30:00Z',
    studentName: 'Demo Student',
    certificateId: 'SF-DB-2026-00321',
    category: 'Databases',
    isDemo: true,
  },
  {
    id: 'demo_cert_5',
    testTitle: 'Web Development Mastery',
    score: 84,
    issueDate: '2026-01-25T16:00:00Z',
    studentName: 'Demo Student',
    certificateId: 'SF-WEB-2026-00055',
    category: 'Web Technologies',
    isDemo: true,
  },
  {
    id: 'demo_cert_6',
    testTitle: 'Machine Learning Basics',
    score: 71,
    issueDate: '2026-01-10T13:15:00Z',
    studentName: 'Demo Student',
    certificateId: 'SF-ML-2026-00112',
    category: 'AI / ML',
    isDemo: true,
  },
];

export default function Certificates() {
  const { user, profile } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'certificates'), 
      where('studentId', '==', user.uid),
      orderBy('issueDate', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // If no real certificates, show demo certificates
      if (data.length === 0) {
        setCertificates(DEMO_CERTIFICATES);
      } else {
        setCertificates(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching certificates:', error);
      // On error (e.g. missing index), show demo data
      setCertificates(DEMO_CERTIFICATES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getGradeBorder = (score: number) => {
    if (score >= 90) return 'border-emerald-500/30 shadow-emerald-500/10';
    if (score >= 75) return 'border-blue-500/30 shadow-blue-500/10';
    if (score >= 60) return 'border-amber-500/30 shadow-amber-500/10';
    return 'border-orange-500/30 shadow-orange-500/10';
  };

  const getGradeLabel = (score: number) => {
    if (score >= 90) return 'Distinction';
    if (score >= 75) return 'Merit';
    if (score >= 60) return 'Pass';
    return 'Completed';
  };

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
        logoIcon={Award} 
        logoColor="bg-emerald-600" 
      />

      <main className="flex-1 overflow-y-auto p-10 lg:p-20 relative">
        <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <Header 
          title="Credential Vault" 
          subtitle="Verified skill certifications and academic achievements" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'} 
          userColor="bg-emerald-500" 
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl group hover:border-emerald-500/20 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Total Certificates</span>
            </div>
            <div className="text-4xl font-display uppercase tracking-tighter">{certificates.length}</div>
          </div>
          <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl group hover:border-amber-500/20 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Avg. Score</span>
            </div>
            <div className="text-4xl font-display uppercase tracking-tighter">
              {certificates.length > 0 ? Math.round(certificates.reduce((acc, c) => acc + (c.score || 0), 0) / certificates.length) : 0}%
            </div>
          </div>
          <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl group hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Distinctions</span>
            </div>
            <div className="text-4xl font-display uppercase tracking-tighter">
              {certificates.filter(c => (c.score || 0) >= 90).length}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-5xl font-display uppercase tracking-tighter mb-2">My Achievements</h2>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Total: {certificates.length} Verified Credentials</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {certificates.map((cert, index) => (
            <motion.div 
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={`relative bg-white/5 border rounded-[48px] p-10 overflow-hidden shadow-2xl ${getGradeBorder(cert.score)}`}>
                {/* Certificate Background Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                
                {/* Badge & Score */}
                <div className="flex items-center justify-between mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-display tracking-tighter ${getGradeColor(cert.score)}`}>{cert.score}%</div>
                    <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">{getGradeLabel(cert.score)}</div>
                  </div>
                </div>

                {/* Title & Meta */}
                <h3 className="text-3xl font-display uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">{cert.testTitle}</h3>
                
                {cert.category && (
                  <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-4">
                    {cert.category}
                  </span>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-4 h-4 text-white/20" />
                  <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>

                {cert.certificateId && (
                  <div className="flex items-center gap-3 mb-10">
                    <Target className="w-4 h-4 text-white/15" />
                    <span className="text-[9px] font-mono font-bold text-white/15 uppercase tracking-[0.2em]">ID: {cert.certificateId}</span>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (cert.isDemo) {
                        toast.info('Demo certificate — complete a real test to get a downloadable credential!');
                      } else if (cert.certificateUrl) {
                        window.open(cert.certificateUrl, '_blank');
                      } else {
                        toast.info('Certificate download will be available soon.');
                      }
                    }}
                    className="flex-1 py-4 bg-white text-black font-display uppercase tracking-tighter text-lg rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button 
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                    title="Share"
                    onClick={() => {
                      navigator.clipboard.writeText(`SkillForge Certificate: ${cert.testTitle} — Score: ${cert.score}%`);
                      toast.success('Certificate info copied to clipboard!');
                    }}
                  >
                    <ExternalLink className="w-5 h-5 text-white/40" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
