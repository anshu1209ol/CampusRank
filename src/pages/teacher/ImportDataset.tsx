import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Database, Upload, ArrowRight, Save, Clock, ChevronLeft, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import { modelProcessDataset } from '@/src/services/aiService';

const sidebarItems = [
  { icon: Database, label: 'Overview', href: '/teacher' },
  { icon: Database, label: 'Import Dataset', href: '/teacher/import' },
];

export default function ImportDataset() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datasetText, setDatasetText] = useState('');
  const [categoryContext, setCategoryContext] = useState('Data Structures and Algorithms');
  const [testTitle, setTestTitle] = useState('Auto-Imported LeetCode Dataset Test');
  const [duration, setDuration] = useState(60);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  const handleImport = async () => {
    if (!datasetText.trim()) {
      toast.error('Please paste a dataset or raw text to process.');
      return;
    }
    
    setLoading(true);
    toast.loading('Analyzing dataset with Machine Learning capabilities...', { id: 'ml-process' });
    try {
      const generatedQs = await modelProcessDataset(datasetText, categoryContext);
      
      if (generatedQs && generatedQs.length > 0) {
        const formattedQs = generatedQs.map((q: any) => ({
          ...q,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));
        setParsedQuestions(formattedQs);
        toast.success(`Successfully extracted ${generatedQs.length} intelligent questions from the dataset!`, { id: 'ml-process' });
      } else {
        toast.error('Failed to extract questions. The dataset might be too unstructured or empty.', { id: 'ml-process' });
      }
    } catch (err) {
      toast.error('Error connecting to ML Processing Service', { id: 'ml-process' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!parsedQuestions.length) return;
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'tests'), {
        title: testTitle,
        category: categoryContext,
        duration: duration,
        description: 'Auto-generated assessment via ML Dataset extraction.',
        questions: parsedQuestions,
        teacherId: user?.uid,
        teacherName: profile?.name,
        createdAt: serverTimestamp(),
        active: true
      });
      toast.success('Assessment saved and published to Practice Hub!');
      navigate('/teacher/tests');
    } catch (error) {
      console.error('Error saving imported test:', error);
      toast.error('Failed to save assessment to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar 
        items={sidebarItems} 
        logoIcon={Database} 
        logoColor="bg-fuchsia-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative">
        <div className="max-w-6xl mx-auto z-10 relative">
          <button 
            onClick={() => navigate('/teacher')}
            className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group text-sm font-mono uppercase tracking-widest"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <Header 
            title="Dataset AI Importer" 
            subtitle="Feed raw CSV, JSON, or text dumps to convert them into living assessments." 
            userInitials={profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'} 
            userColor="bg-fuchsia-500" 
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Input Setup */}
            <div className="space-y-8">
              <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-600/10 blur-[80px]" />
                
                <h2 className="text-2xl font-display uppercase tracking-tighter mb-6 flex items-center gap-3">
                  <Database className="w-6 h-6 text-fuchsia-400" /> Layer Input Data
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] block mb-2">Test Title (Publish Name)</label>
                    <input 
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-fuchsia-500/30 transition-all uppercase tracking-wider"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] block mb-2">Category / Context</label>
                      <input 
                        type="text"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-fuchsia-500/30 transition-all uppercase tracking-wider"
                        value={categoryContext}
                        onChange={(e) => setCategoryContext(e.target.value)}
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] block mb-2">Duration (mins)</label>
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-fuchsia-500/30 transition-all uppercase tracking-wider"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] block mb-2">Raw Dataset (Paste CSV, JSON rows, or Text below)</label>
                    <textarea 
                      className="w-full h-80 bg-black/40 border border-white/10 rounded-3xl p-6 font-mono text-xs focus:ring-2 focus:ring-fuchsia-500/30 transition-all text-fuchsia-100 placeholder:text-white/10 tracking-widest leading-relaxed resize-y"
                      placeholder="id, title, description, difficulty&#10;1, Two Sum, Given an array of ints..., Easy&#10;..."
                      value={datasetText}
                      onChange={(e) => setDatasetText(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleImport}
                    disabled={loading || saving}
                    className="w-full py-5 bg-white text-black font-display uppercase tracking-tighter text-xl rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-2xl"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                    Initiate ML Extraction
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Output Preview */}
            <div className="space-y-8">
              <div className="p-8 bg-transparent border border-white/10 rounded-[40px] h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-display uppercase tracking-tighter flex items-center gap-3">
                    <ArrowRight className="w-6 h-6 text-emerald-400" /> Extraction Results
                  </h2>
                  <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">
                    {parsedQuestions.length} Identified
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-4 max-h-[600px] scrollbar-thin">
                  {parsedQuestions.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-white/20 text-center space-y-4">
                      <Database className="w-16 h-16 opacity-50" />
                      <p className="font-mono text-xs uppercase tracking-widest max-w-[200px]">Waiting for pipeline input stream...</p>
                    </div>
                  ) : (
                    parsedQuestions.map((q, idx) => (
                      <div key={q.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl relative">
                        <div className="flex justify-between items-start mb-4">
                          <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-display font-medium text-sm">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/50 bg-black/40 px-3 py-1 rounded-lg">
                            {q.type}
                          </span>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-wider mb-4 leading-relaxed">{q.question}</p>
                        
                        {q.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {q.options.map((opt: string, i: number) => (
                              <div key={i} className={`p-3 rounded-xl border text-[10px] font-mono uppercase tracking-widest ${q.correct === i ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-black/40 border-white/5 text-white/40'}`}>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === 'coding' && (
                          <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                              <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.2em]">{q.language || 'UNKNOWN'}</span>
                            </div>
                            <pre className="font-mono text-[10px] text-fuchsia-300 overflow-x-auto whitespace-pre-wrap">{q.placeholder}</pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {parsedQuestions.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <button 
                      onClick={handleSaveToDatabase}
                      disabled={saving}
                      className="w-full py-5 bg-emerald-500 text-white font-display uppercase tracking-tighter text-xl rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-emerald-500/20 active:scale-95"
                    >
                      {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                      Publish to Practice Hub
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}