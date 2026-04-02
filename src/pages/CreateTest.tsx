import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  FileText, 
  Clock, 
  Layout, 
  CheckCircle2,
  Loader2,
  Sparkles,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';
import { autoGenerateTestQuestions } from '@/src/services/aiService';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';

const sidebarItems = [
  { icon: Layout, label: 'Overview', href: '/teacher' },
  { icon: FileText, label: 'Manage Tests', href: '/teacher/tests' },
];

export default function CreateTest() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [testData, setTestData] = useState({
    title: '',
    category: 'Technical',
    duration: 60,
    description: '',
  });

  const [questions, setQuestions] = useState<any[]>([
    { 
      id: '1', 
      type: 'coding', 
      question: 'Write a program to print "Hello, CampusRank!" to the console.', 
      language: 'javascript',
      placeholder: 'console.log("Hello, CampusRank!");',
      options: ['', '', '', ''], 
      correct: 0 
    },
    { 
      id: '2', 
      type: 'coding', 
      question: 'Write a Python function to calculate the factorial of a number and print it for 5.', 
      language: 'python',
      placeholder: 'def factorial(n):\n    # Write your code here\n    pass\n\nprint(factorial(5))',
      options: ['', '', '', ''], 
      correct: 0 
    }
  ]);
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleAutoGenerate = async () => {
    if (!testData.title || testData.title.trim() === '') {
      toast.error('Please enter an Assessment Title first so the AI knows what to generate.');
      return;
    }
    
    setGeneratingAI(true);
    toast.loading('AI is crafting intelligent questions...', { id: 'ai-gen' });
    try {
      const generatedQ = await autoGenerateTestQuestions(testData.title, testData.category, 5);
      
      if (generatedQ && generatedQ.length > 0) {
        const formattedQs = generatedQ.map((q: any) => ({
          ...q,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));
        
        if (questions.length === 1 && !questions[0].question) {
           setQuestions(formattedQs);
        } else {
           setQuestions([...questions, ...formattedQs]);
        }
        toast.success(`Generated ${generatedQ.length} premium AI questions!`, { id: 'ai-gen' });
      } else {
        toast.error('Failed to generate questions. Check API Key.', { id: 'ai-gen' });
      }
    } catch (err) {
      toast.error('Error connecting to AI service', { id: 'ai-gen' });
    } finally {
      setGeneratingAI(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now().toString(), type: 'mcq', question: '', options: ['', '', '', ''], correct: 0 }
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSave = async () => {
    if (!testData.title || questions.some(q => !q.question)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'tests'), {
        ...testData,
        questions,
        teacherId: user?.uid,
        teacherName: profile?.name,
        createdAt: serverTimestamp(),
        active: true
      });
      toast.success('Test created successfully!');
      navigate('/teacher');
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <Sidebar 
        items={sidebarItems} 
        logoIcon={FileText} 
        logoColor="bg-indigo-600" 
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => navigate('/teacher')}
            className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <Header 
            title="Design Assessment" 
            subtitle="Architect the perfect benchmark for your students" 
            userInitials={profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'} 
            userColor="bg-indigo-500" 
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Test Settings */}
            <div className="lg:col-span-1 space-y-10">
              <div className="p-10 bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl" />
                <h3 className="text-2xl font-display uppercase tracking-tighter mb-8 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                    <Layout className="w-5 h-5 text-indigo-400" />
                  </div>
                  Configuration
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] block mb-3">Assessment Title</label>
                    <input 
                      type="text"
                      value={testData.title}
                      onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                      placeholder="E.G. QUANTUM COMPUTING 101"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-white/10 uppercase tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] block mb-3">Domain Category</label>
                    <select 
                      value={testData.category}
                      onChange={(e) => setTestData({ ...testData, category: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none uppercase tracking-wider cursor-pointer"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Aptitude">Aptitude</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] block mb-3">Time Limit (MINS)</label>
                    <div className="relative">
                      <Clock className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                      <input 
                        type="number"
                        value={testData.duration}
                        onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full py-8 bg-white text-black font-display uppercase tracking-tighter text-2xl rounded-[40px] hover:scale-[1.02] transition-all shadow-2xl shadow-white/5 flex items-center justify-center gap-4 group disabled:opacity-50 active:scale-95"
              >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Save className="w-8 h-8 group-hover:scale-110 transition-transform" />}
                Deploy Benchmark
              </button>
            </div>

            {/* Questions Editor */}
            <div className="lg:col-span-2 space-y-12 mt-12 lg:mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter">Questions ({questions.length})</h2>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <button 
                    onClick={handleAutoGenerate}
                    disabled={generatingAI}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-2xl font-display uppercase tracking-tighter text-sm md:text-lg hover:bg-neon-purple/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {generatingAI ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5" />}
                    Auto-Generate
                  </button>
                  <button 
                    onClick={addQuestion}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 md:px-8 py-3 md:py-4 bg-white/5 border border-white/10 rounded-2xl font-display uppercase tracking-tighter text-sm md:text-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
                    Add New
                  </button>
                </div>
              </div>

              <div className="space-y-8 md:space-y-12">
                {questions.map((q, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={q.id} 
                    className="p-6 md:p-12 bg-white/5 border border-white/10 rounded-[32px] md:rounded-[56px] relative group backdrop-blur-xl overflow-visible"
                  >
                    <div className="absolute top-0 left-0 w-1 md:w-2 h-full bg-indigo-600/40 rounded-l-[32px] md:rounded-l-[56px]" />
                    
                    <button 
                      onClick={() => removeQuestion(q.id)}
                      className="absolute top-4 right-4 md:top-10 md:right-10 p-3 bg-red-500/10 text-red-500 rounded-xl md:rounded-2xl opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 mb-6 md:mb-10 w-full pr-12 md:pr-0">
                      <span className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-white text-black rounded-xl md:rounded-2xl flex items-center justify-center font-display text-xl md:text-2xl shadow-2xl">
                        {idx + 1}
                      </span>
                      <div className="relative w-full overflow-hidden">
                        <select 
                          value={q.type}
                          onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                          className="bg-transparent border-none focus:ring-0 font-display uppercase tracking-tighter text-xl md:text-3xl cursor-pointer py-2 appearance-none w-full pr-10 text-ellipsis"
                        >
                          <option value="mcq">Multiple Choice</option>
                          <option value="coding">Coding Challenge</option>
                          <option value="subjective">Subjective</option>
                        </select>
                        <Layout className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 pointer-events-none" />
                      </div>
                    </div>

                    <textarea 
                      placeholder="ENTER YOUR QUESTION PROMPT HERE..."
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-[20px] md:rounded-3xl px-6 md:px-10 py-6 md:py-8 mb-6 md:mb-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-lg md:text-2xl font-bold min-h-[120px] md:min-h-[160px] placeholder:text-white/10 uppercase tracking-tight"
                    />

                    {q.type === 'mcq' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="relative group/opt">
                            <input 
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                newOpts[optIdx] = e.target.value;
                                updateQuestion(q.id, { options: newOpts });
                              }}
                              placeholder={`OPTION ${String.fromCharCode(65 + optIdx)}`}
                              className={`w-full bg-white/5 border rounded-2xl pl-20 pr-8 py-6 text-sm font-bold transition-all uppercase tracking-wider ${
                                q.correct === optIdx ? 'border-emerald-500/50 ring-4 ring-emerald-500/10 bg-emerald-500/5' : 'border-white/10 focus:border-white/20'
                              }`}
                            />
                            <button 
                              onClick={() => updateQuestion(q.id, { correct: optIdx })}
                              className={`absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl transition-all shadow-xl ${
                                q.correct === optIdx ? 'bg-emerald-500 text-white scale-110' : 'bg-white/10 text-white/30 hover:bg-white/20'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </button>
                            {q.correct === optIdx && (
                              <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'coding' && (
                      <div className="space-y-4 md:space-y-6 mt-6 md:mt-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] block shrink-0">
                            Programming Language
                          </label>
                          <div className="relative w-full sm:w-auto">
                            <select 
                              value={q.language || 'javascript'}
                              onChange={(e) => updateQuestion(q.id, { language: e.target.value })}
                              className="w-full sm:w-auto bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 cursor-pointer text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none uppercase tracking-wider text-ellipsis"
                            >
                              <option value="javascript">JavaScript (Node.js)</option>
                              <option value="python">Python</option>
                              <option value="cpp">C++</option>
                              <option value="java">Java</option>
                              <option value="go">Go</option>
                              <option value="rust">Rust</option>
                            </select>
                            <Layout className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] block mb-3">
                            Starter Code (Optional)
                          </label>
                          <textarea 
                            value={q.placeholder || ''}
                            onChange={(e) => updateQuestion(q.id, { placeholder: e.target.value })}
                            placeholder="// Your starter code here..."
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-[20px] md:rounded-[32px] px-6 md:px-8 py-6 font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-indigo-300 min-h-[160px] md:min-h-[200px] placeholder:text-white/10"
                            spellCheck="false"
                          />
                        </div>
                      </div>
                    )}

                    {q.type === 'subjective' && (
                      <div className="p-10 bg-black/40 rounded-3xl border border-white/5 font-mono text-xs uppercase tracking-[0.2em] text-white/20 text-center">
                        Rich text editor will be provided for detailed responses.
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
