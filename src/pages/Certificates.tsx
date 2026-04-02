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
  Target
} from 'lucide-react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import { toast } from 'sonner';

const sidebarItems = [
  { icon: Award, label: 'My Certificates', href: '/certificates' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: GraduationCap, label: 'Student Dashboard', href: '/student' },
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
      setCertificates(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

        <div className="mb-12">
          <h2 className="text-5xl font-display uppercase tracking-tighter mb-2">My Achievements</h2>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Total: {certificates.length} Verified Credentials</p>
        </div>

        {certificates.length === 0 ? (
          <div className="p-20 bg-white/5 border border-white/10 rounded-[48px] text-center">
            <Award className="w-20 h-20 text-white/10 mx-auto mb-8" />
            <h3 className="text-3xl font-display uppercase tracking-tighter mb-4 text-white/40">No Certificates Found</h3>
            <p className="text-white/20 font-mono text-sm uppercase tracking-widest">Complete a test to earn your first verified credential</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {certificates.map((cert) => (
              <motion.div 
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/5 border border-white/10 rounded-[48px] p-10 overflow-hidden">
                  {/* Certificate Background Element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                  
                  <div className="flex items-center justify-between mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-display text-emerald-500 tracking-tighter">{cert.score}%</div>
                      <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Proficiency</div>
                    </div>
                  </div>

                  <h3 className="text-3xl font-display uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">{cert.testTitle}</h3>
                  <div className="flex items-center gap-3 mb-10">
                    <Calendar className="w-4 h-4 text-white/20" />
                    <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => window.open(cert.certificateUrl, '_blank')}
                      className="flex-1 py-4 bg-white text-black font-display uppercase tracking-tighter text-lg rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                    <button 
                      className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                      title="Share"
                    >
                      <ExternalLink className="w-5 h-5 text-white/40" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
