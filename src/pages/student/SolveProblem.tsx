import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { 
  Loader2, 
  ChevronLeft, 
  Play, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Code2, 
  AlertCircle,
  Clock,
  Cpu,
  Shield,
  Zap,
  Layout,
  Send
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';

export default function SolveProblem() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [codeRunning, setCodeRunning] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;
      try {
        // 1. Try backend API first (reads from local problems.json — most reliable)
        let found = false;
        try {
          const apiRes = await fetch(`/api/problems/${problemId}`);
          if (apiRes.ok) {
            const data = await apiRes.json();
            setProblem(data);
            const lang = data.language || 'python';
            const defaultCode = data.placeholder || (data.solution_code && data.solution_code[lang]) || '';
            setCode(defaultCode);
            setLanguage(lang);
            found = true;
          }
        } catch (apiErr) {
          console.warn('API fetch failed, trying Firestore:', apiErr);
        }

        // 2. Firestore fallback
        if (!found) {
          try {
            const problemDoc = await getDoc(doc(db, 'problems', problemId));
            if (problemDoc.exists()) {
              const data = problemDoc.data();
              setProblem({ id: problemDoc.id, ...data });
              const defaultCode = data.placeholder || (data.solutionCode && data.solutionCode[data.language || 'python']) || '';
              setCode(defaultCode);
              setLanguage(data.language || 'python');
              found = true;
            }
          } catch (fsErr) {
            console.warn('Firestore fetch failed:', fsErr);
          }
        }

        // 3. Mock data fallback for demo IDs
        if (!found) {
          const mocks: Record<string, any> = {
            'p1': {
              title: 'Two Sum Optimized',
              difficulty: 'Easy',
              description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
              placeholder: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Your logic here\n}',
              language: 'javascript',
              testCases: [
                { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
                { input: '[3,2,4], 6', expectedOutput: '[1,2]' }
              ]
            },
            'p2': {
              title: 'Binary Tree Maximum Path Sum',
              difficulty: 'Hard',
              description: 'Given a non-empty binary tree, find the maximum path sum.\n\nFor this problem, a path is defined as any sequence of nodes from some starting node to any node in the tree along the parent-child connections. The path must contain at least one node and does not need to go through the root.',
              placeholder: 'class Solution {\n    public int maxPathSum(TreeNode root) {\n        // Your logic here\n    }\n}',
              language: 'java',
              testCases: [
                { input: '[1,2,3]', expectedOutput: '6' },
                { input: '[-10,9,20,null,null,15,7]', expectedOutput: '42' }
              ]
            }
          };
          if (mocks[problemId]) {
            setProblem(mocks[problemId]);
            setCode(mocks[problemId].placeholder || '');
            setLanguage(mocks[problemId].language || 'javascript');
          } else {
            toast.error('Problem not found');
            navigate('/student/problems');
          }
        }
      } catch (error) {
        console.error('Error fetching problem:', error);
        toast.error('Failed to load problem');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setTimeTaken(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunCode = async (isSubmission = false) => {
    if (!code) return;
    setCodeRunning(true);
    setResults(null);
    setError(null);
    
    try {
      const token = user ? await user.getIdToken() : '';
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ problemId, language, code, testCases: problem.testCases || problem.test_cases }),

      });
      
      const { token: executionToken, error } = await response.json();
      if (error) throw new Error(error);

      // Start Polling (Architecture Flow)
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/check-status/${executionToken}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const update = await statusRes.json();
          
          if (update.results) {
            setResults(update.results);
          }

          if (update.status === 'completed') {
            clearInterval(pollInterval);
            setCodeRunning(false);
            
            const allPassed = update.results.every((r: any) => r.passed);
            if (allPassed) {
              toast.success('Perfect! All test cases passed.');
              if (isSubmission) await saveSubmission(update.results);
            } else {
              toast.warning('Some test cases failed. Keep refining!');
            }
          } else if (update.status === 'error') {
            clearInterval(pollInterval);
            setCodeRunning(false);
            setError(update.error);
            toast.error('Execution error');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setCodeRunning(false);
          toast.error('Polling connection lost');
        }
      }, 1500);

    } catch (error: any) {
      toast.error('Hypervisor connection failure: ' + error.message);
      setCodeRunning(false);
    }
  };

  const saveSubmission = async (testResults: any[]) => {
    if (!user || !problem) return;
    
    try {
      const accuracy = Math.round((testResults.filter(r => r.passed).length / testResults.length) * 100);
      
      await addDoc(collection(db, 'submissions'), {
        studentId: user.uid,
        studentName: user.displayName || 'Anonymous',
        studentEmail: user.email,
        problemId: problemId,
        problemTitle: problem.title,
        code,
        language,
        accuracy,
        score: accuracy === 100 ? 10 : 0, // 10 points for perfect submission
        testResults,
        timestamp: serverTimestamp(),
        type: 'practice'
      });
      
      toast.success('Solution submitted successfully! Points added to leaderboard.');
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Failed to save submission');
    }
  };

  if (loading || !problem) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-3xl px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/student/problems')}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden bg-black border border-white/5">
              <img src="/logo.png" alt="SkillForge" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-display uppercase tracking-tighter text-lg leading-none">{problem.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm ${
                  problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                  problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {problem.difficulty}
                </span>
                <span className="text-[8px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Runtime Isolation v1.0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 bg-white/3 border border-white/10 rounded-2xl px-6 py-2">
            <Clock className="w-4 h-4 text-white/20" />
            <span className="font-mono text-sm uppercase tracking-widest">{formatTime(timeTaken)}</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleRunCode(false)}
              disabled={codeRunning}
              className="p-4 bg-white/3 border border-white/10 rounded-2xl hover:bg-white/5 transition-all text-white/40 hover:text-white disabled:opacity-50"
              title="Run Tests"
            >
              <Terminal className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleRunCode(true)}
              disabled={codeRunning}
              className="px-10 py-4 bg-orange-600 text-white font-display uppercase tracking-tighter text-lg rounded-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl shadow-orange-500/20 active:scale-95"
            >
              {codeRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Proof
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left: Problem Details */}
        <aside className="w-[450px] border-r border-white/5 p-10 overflow-y-auto bg-black/20 flex flex-col">
          <div className="space-y-12 mb-12">
            <section>
              <h3 className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-[0.4em] mb-6">Objective</h3>
              <div className="prose prose-invert prose-orange max-w-none">
                <p className="text-white/60 leading-relaxed font-medium text-base whitespace-pre-wrap">
                  {problem.description}
                </p>
              </div>
            </section>

            {problem.inputFormat && (
              <section>
                <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em] mb-4">Input Format</h3>
                <p className="text-sm text-white/60 font-mono italic">{problem.inputFormat}</p>
              </section>
            )}

            {problem.outputFormat && (
              <section>
                <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em] mb-4">Output Format</h3>
                <p className="text-sm text-white/60 font-mono italic">{problem.outputFormat}</p>
              </section>
            )}

            {problem.constraints && (
              <section>
                <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em] mb-4">Constraints</h3>
                <div className="p-4 bg-white/3 border border-white/5 rounded-2xl font-mono text-xs text-white/40 leading-relaxed">
                  {problem.constraints}
                </div>
              </section>
            )}

            {(problem.sampleInput || problem.sampleOutput) && (
              <section className="space-y-6">
                <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em] mb-4">Sample Matrices</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="group">
                    <span className="text-[9px] font-mono text-white/20 uppercase mb-2 block font-bold tracking-widest">Input Stream</span>
                    <pre className="p-4 bg-black/40 rounded-2xl font-mono text-xs text-white/40 border border-white/5 group-hover:border-white/10 transition-colors whitespace-pre-wrap">
                      {problem.sampleInput || 'None'}
                    </pre>
                  </div>
                  <div className="group">
                    <span className="text-[9px] font-mono text-white/20 uppercase mb-2 block font-bold tracking-widest">Expected Result</span>
                    <pre className="p-4 bg-white/3 rounded-2xl font-mono text-xs text-emerald-500/60 border border-emerald-500/10 group-hover:border-emerald-500/20 transition-colors whitespace-pre-wrap">
                      {problem.sampleOutput || 'None'}
                    </pre>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8 mt-auto">
            {/* System Status */}
            <div className="p-8 bg-white/3 border border-white/5 rounded-[40px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full" />
              <div className="flex items-center gap-4 mb-6">
                <Shield className="w-6 h-6 text-orange-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/40">Environment Status</span>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-white/20" />
                    <span className="text-xs text-white/60">Compiler</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-500">READY</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-white/20" />
                    <span className="text-xs text-white/60">Latency</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white/40">14ms</span>
                </div>
              </div>
            </div>

            <div className="rounded-[40px] p-8 border border-white/5 bg-white/3 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-orange-600/10 flex items-center justify-center text-orange-500 mb-4 animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                Automatic submission tracking is active. Academic integrity strictly enforced.
              </p>
            </div>
          </div>
        </aside>

        {/* Right: Code Editor & Console */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#080808]">
          {/* Language Selection */}
          <div className="h-16 px-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                 <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest">{language.toUpperCase()}</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                 <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">Isolated Host</span>
               </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all">Reset Template</button>
            </div>
          </div>

          <div className="flex-1 relative flex flex-col">
            <div className="flex-1 py-8 relative">
              <Editor
                height="100%"
                defaultLanguage={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  fontSize: 16,
                  fontFamily: 'JetBrains Mono',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  contextmenu: true,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  padding: { top: 20, bottom: 20 }
                }}
                className="font-mono"
                loading={<div className="h-full w-full flex items-center justify-center text-white/20 font-mono text-xs animate-pulse uppercase tracking-[0.2em]">Initializing Virtual Machine...</div>}
              />
            </div>

            {/* Results/Console Panel */}
            <div className={`transition-all duration-700 ease-in-out border-t border-white/5 bg-black/80 backdrop-blur-3xl overflow-hidden ${results || error ? 'h-[400px]' : 'h-0'}`}>
              <div className="h-full flex flex-col p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <Terminal className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em] mb-1">Audit Log</h4>
                      <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">Compiler Verification Sequence complete</span>
                    </div>
                  </div>
                  {results && (
                    <div className="flex items-center gap-4 px-6 py-2 bg-white/3 rounded-full border border-white/5">
                       <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                         Success Matrix: {results.filter(r => r.passed).length}/{results.length}
                       </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {results ? results.map((res, idx) => (
                    <div key={idx} className="group p-6 bg-white/[0.02] border border-white/5 rounded-[32px] hover:border-white/10 transition-all">
                       <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${res.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                              {res.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                               <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em]">Module #{idx + 1}</span>
                               <h5 className="text-sm font-bold uppercase tracking-tight mt-0.5">{res.passed ? 'VERIFIED' : 'FAILED'}</h5>
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] font-mono text-white/10 uppercase mb-1">Execution</span>
                            <span className="text-xs font-mono font-bold text-white/40">{res.duration}ms</span>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div>
                            <span className="text-[9px] font-mono text-white/15 uppercase mb-2 block font-bold">Input Block</span>
                            <div className="p-4 bg-black/40 rounded-2xl font-mono text-[11px] text-white/30 truncate border border-white/5">{res.input || '[]'}</div>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-white/15 uppercase mb-2 block font-bold">Expected Hash</span>
                            <div className="p-4 bg-emerald-500/5 rounded-2xl font-mono text-[11px] text-emerald-500/70 truncate border border-emerald-500/10">{res.expectedOutput}</div>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-white/15 uppercase mb-2 block font-bold">Actual Output</span>
                            <div className={`p-4 rounded-2xl font-mono text-[11px] truncate border ${res.passed ? 'bg-white/5 text-white/60 border-white/5' : 'bg-red-500/5 text-red-400/80 border-red-500/10'}`}>
                              {res.actualOutput || (res.error ? 'CORE_DUMP' : 'NULL')}
                            </div>
                          </div>
                       </div>
                    </div>
                  )) : error ? (
                    <div className="p-10 bg-red-500/5 border border-red-500/10 rounded-[40px] flex flex-col items-center justify-center text-center">
                       <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                       <h5 className="text-xl font-display uppercase tracking-tighter text-red-500 mb-2">Internal Linkage Error</h5>
                       <pre className="text-sm font-mono text-red-400/60 max-w-xl line-clamp-4">{error}</pre>
                    </div>
                  ) : (
                    <div className="p-32 flex flex-col items-center justify-center text-center">
                       <Cpu className="w-16 h-16 text-white/5 mb-6" />
                       <p className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.4em]">Awaiting Execution Pulse...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
