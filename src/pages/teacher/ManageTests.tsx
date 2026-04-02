import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  Clock, 
  Users,
  Trash2,
  Edit3,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Table from '@/src/components/Table';
import { toast } from 'sonner';

const sidebarItems = [
  { icon: FileText, label: 'Overview', href: '/teacher' },
  { icon: FileText, label: 'Manage Tests', href: '/teacher/tests' },
  { icon: Users, label: 'Students', href: '/teacher/students' },
  { icon: ShieldAlert, label: 'Cheating Alerts', href: '/teacher/alerts' },
];

import { ShieldAlert, BarChart3 } from 'lucide-react';

export default function ManageTests() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tests'),
      where('teacherId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'tests', testId));
      toast.success('Test deleted successfully');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    }
  };

  const filteredTests = tests.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          title="Manage Assessments" 
          subtitle="Create, edit, and monitor your skill benchmarks" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'} 
          userColor="bg-indigo-500" 
        />

        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-6 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          
          <button 
            onClick={() => navigate('/teacher/create-test')}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 text-white font-display uppercase tracking-tighter text-xl rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Create New Test
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Table 
            title="Your Assessments"
            data={filteredTests}
            columns={[
              { 
                header: 'Test Details', 
                accessor: (item) => (
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-2xl font-display uppercase tracking-tighter mb-1">{item.title}</div>
                      <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">{item.category}</div>
                    </div>
                  </div>
                )
              },
              { 
                header: 'Configuration', 
                accessor: (item) => (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      {item.duration} Mins
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </div>
                  </div>
                )
              },
              { 
                header: 'Status', 
                accessor: (item) => (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-500/80">Active</span>
                  </div>
                )
              },
              { 
                header: 'Actions', 
                accessor: (item) => (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigate(`/test/${item.id}`)}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                      title="Preview Test"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    <button 
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                      title="Edit Test"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors text-red-500"
                      title="Delete Test"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )
              }
            ]}
          />
        </div>
      </main>
    </div>
  );
}
