import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Users, 
  GraduationCap, 
  MoreVertical,
  Loader2,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Activity
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Table from '@/src/components/Table';
import { toast } from 'sonner';

const sidebarItems = [
  { icon: Activity, label: 'System Overview', href: '/admin' },
  { icon: Users, label: 'User Management', href: '/admin/users' },
  { icon: Building2, label: 'Colleges', href: '/admin/colleges' },
  { icon: Shield, label: 'Security Logs', href: '/admin/security' },
];

export default function Colleges() {
  const { user, profile } = useAuth();
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollege, setNewCollege] = useState({
    name: '',
    location: '',
    status: 'active' as const
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'colleges'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setColleges(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'colleges'), {
        ...newCollege,
        studentCount: 0,
        teacherCount: 0,
        createdAt: serverTimestamp()
      });
      toast.success('College registered successfully');
      setIsModalOpen(false);
      setNewCollege({ name: '', location: '', status: 'active' });
    } catch (error) {
      console.error('Error adding college:', error);
      toast.error('Failed to register college');
    }
  };

  const handleDeleteCollege = async (id: string) => {
    if (!confirm('Are you sure you want to remove this institution?')) return;
    try {
      await deleteDoc(doc(db, 'colleges', id));
      toast.success('College removed');
    } catch (error) {
      toast.error('Failed to remove college');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'colleges', id), { status: newStatus });
      toast.success(`College ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
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
        logoIcon={Building2} 
        logoColor="bg-indigo-600" 
      />

      <main className="flex-1 overflow-y-auto p-10 lg:p-20 relative">
        <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <Header 
          title="Institutional Nexus" 
          subtitle="Manage and monitor registered colleges and universities" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'} 
          userColor="bg-indigo-500" 
        />

        <div className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-5xl font-display uppercase tracking-tighter mb-2">Registered Entities</h2>
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Total: {colleges.length} Institutions</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-4 px-10 py-5 bg-white text-black font-display uppercase tracking-tighter text-xl rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-white/5 active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Register Institution
          </button>
        </div>

        <Table 
          title="College Directory"
          data={colleges}
          columns={[
            { header: 'Institution', accessor: (item) => (
              <div className="flex items-center gap-6 py-2">
                <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-display uppercase tracking-tighter mb-1">{item.name}</div>
                  <div className="text-[10px] font-mono font-bold text-white/20 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500/40" />
                    {item.location || 'Global/Remote'}
                  </div>
                </div>
              </div>
            )},
            { header: 'Population', accessor: (item) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-white/60">
                  <Users className="w-4 h-4 text-emerald-500/60" />
                  <span className="text-lg font-display tracking-tight">{item.studentCount || 0} Students</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <GraduationCap className="w-4 h-4 text-amber-500/60" />
                  <span className="text-lg font-display tracking-tight">{item.teacherCount || 0} Teachers</span>
                </div>
              </div>
            )},
            { header: 'Status', accessor: (item) => (
              <div className="flex items-center">
                <span className={`px-6 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] border ${
                  item.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                  'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {item.status}
                </span>
              </div>
            )},
            { header: 'Actions', accessor: (item) => (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleStatus(item.id, item.status)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                  title={item.status === 'active' ? 'Suspend' : 'Activate'}
                >
                  {item.status === 'active' ? <XCircle className="w-5 h-5 text-amber-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </button>
                <button 
                  onClick={() => handleDeleteCollege(item.id)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            )},
          ]}
        />

        {/* Register Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[48px] p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full -mr-32 -mt-32" />
              
              <h3 className="text-4xl font-display uppercase tracking-tighter mb-8">Register Institution</h3>
              
              <form onSubmit={handleAddCollege} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.3em] ml-4">College Name</label>
                  <input 
                    required
                    value={newCollege.name}
                    onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-xl font-display tracking-tight focus:outline-none focus:border-indigo-500/50 transition-colors"
                    placeholder="e.g. Stanford University"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.3em] ml-4">Location</label>
                  <input 
                    value={newCollege.location}
                    onChange={(e) => setNewCollege({ ...newCollege, location: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-xl font-display tracking-tight focus:outline-none focus:border-indigo-500/50 transition-colors"
                    placeholder="e.g. California, USA"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 bg-white/5 border border-white/10 text-white font-display uppercase tracking-tighter text-xl rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-indigo-600 text-white font-display uppercase tracking-tighter text-xl rounded-2xl hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/20"
                  >
                    Register
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
