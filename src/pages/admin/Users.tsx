import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Shield, 
  Building2, 
  Activity, 
  UserPlus, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  UserCheck, 
  UserX,
  Loader2
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Table from '@/src/components/Table';
import StatCard from '@/src/components/StatCard';
import { toast } from 'sonner';

const sidebarItems = [
  { icon: Activity, label: 'System Overview', href: '/admin' },
  { icon: Users, label: 'User Management', href: '/admin/users' },
  { icon: Building2, label: 'Colleges', href: '/admin/colleges' },
  { icon: Shield, label: 'Security Logs', href: '/admin/security' },
];

export default function UsersManagement() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'student' ? 'teacher' : 'student';
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.college?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar 
        items={sidebarItems} 
        logoIcon={Shield} 
        logoColor="bg-amber-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <Header 
          title="User Management" 
          subtitle="Control access and manage identities across the platform" 
          userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'} 
          userColor="bg-amber-500" 
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <StatCard label="Total Identities" value={stats.total.toString()} icon={Users} color="text-amber-400" bg="bg-amber-400/20" />
          <StatCard label="Students" value={stats.students.toString()} icon={Users} color="text-blue-400" bg="bg-blue-400/20" />
          <StatCard label="Teachers" value={stats.teachers.toString()} icon={Users} color="text-indigo-400" bg="bg-indigo-400/20" />
          <StatCard label="Administrators" value={stats.admins.toString()} icon={Shield} color="text-emerald-400" bg="bg-emerald-400/20" />
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-6 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          
          <button className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-amber-500 text-black font-display uppercase tracking-tighter text-xl rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-amber-500/20 active:scale-95">
            <UserPlus className="w-6 h-6" />
            Provision User
          </button>
        </div>

        <Table 
          title="Platform Subjects"
          data={filteredUsers}
          columns={[
            { 
              header: 'Subject Profile', 
              accessor: (item) => (
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-display text-2xl text-white/20 overflow-hidden">
                    {item.photoURL ? (
                      <img src={item.photoURL} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      item.name?.split(' ').map((n: string) => n[0]).join('')
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-display uppercase tracking-tighter mb-1">{item.name}</div>
                    <div className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {item.email}
                    </div>
                  </div>
                </div>
              )
            },
            { 
              header: 'Access Level', 
              accessor: (item) => (
                <div className="flex items-center">
                  <span className={`px-6 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] border ${
                    item.role === 'teacher' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 
                    item.role === 'admin' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  }`}>
                    {item.role}
                  </span>
                </div>
              )
            },
            { 
              header: 'Institution', 
              accessor: (item) => (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-white/20" />
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/40">{item.college || 'N/A'}</span>
                </div>
              )
            },
            { 
              header: 'Actions', 
              accessor: (item) => (
                <div className="flex items-center gap-4">
                  {item.role !== 'admin' && (
                    <button 
                      onClick={() => handleToggleRole(item.id, item.role)}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-amber-400"
                      title="Toggle Role"
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors text-red-500"
                    title="Delete User"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )
            }
          ]}
        />
      </main>
    </div>
  );
}
