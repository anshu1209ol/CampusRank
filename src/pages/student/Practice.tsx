import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Layout, Library, ChevronLeft, Search, Loader2, Code2 } from 'lucide-react';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import TestCard from '@/src/components/TestCard';
import { useAuth } from '@/src/contexts/AuthContext';

const sidebarItems = [
  { icon: Layout, label: 'Dashboard', href: '/student' },
  { icon: Code2, label: 'Problems', href: '/student/problems' },
  { icon: Library, label: 'Practice Hub', href: '/student/practice' },
];

export default function Practice() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const testsQuery = query(
          collection(db, 'tests')
        );
        const testsSnapshot = await getDocs(testsQuery);
        
        const fetchedTests = testsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Soft filter and sort client-side to bypass Firestore index requirements
        .filter(test => (test as any).active !== false)
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        
        setTests(fetchedTests);
      } catch (error) {
        console.error('Error fetching practice tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const categories = ['All', ...new Set(tests.map(test => test.category))].filter(Boolean) as string[];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || test.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar 
        items={sidebarItems} 
        logoIcon={Library} 
        logoColor="bg-violet-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <button 
            onClick={() => navigate('/student')}
            className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group text-sm font-mono uppercase tracking-widest"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <Header 
            title="Practice Hub" 
            subtitle="Explore available assessments to hone your skills" 
            userInitials={profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'} 
            userColor="bg-violet-500" 
          />

          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="text"
                placeholder="SEARCH ASSESSMENTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[32px] pl-14 pr-8 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all placeholder:text-white/20 uppercase tracking-wider"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-8 py-5 rounded-[32px] font-mono text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${
                    filterCategory === category 
                      ? 'bg-violet-600/20 text-violet-400 border-violet-500/30 shadow-lg shadow-violet-500/10' 
                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            </div>
          ) : filteredTests.length > 0 ? (
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredTests.map((test) => (
                <motion.div 
                  key={test.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 20 },
                    show: { opacity: 1, scale: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <TestCard 
                    id={test.id}
                    title={test.title}
                    duration={`${test.duration} mins`}
                    date={test.createdAt?.toDate ? test.createdAt.toDate().toLocaleDateString() : 'Active'}
                    category={test.category}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-xl">
              <Library className="w-16 h-16 text-white/20 mb-6" />
              <h3 className="text-2xl font-display uppercase tracking-tighter mb-2">No Assessments Found</h3>
              <p className="text-white/40 max-w-sm uppercase tracking-widest text-[10px] font-mono">
                {searchQuery || filterCategory !== 'All' 
                  ? 'Try modifying your search filters to see more results.' 
                  : 'Check back later for new coding challenges and tests.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
