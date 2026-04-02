import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  ShieldAlert, 
  Maximize2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Send,
  Flag,
  Loader2,
  Sparkles,
  Play,
  Terminal
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';
import { getAIHint } from '@/src/services/aiService';

export default function TestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [hints, setHints] = useState<Record<string, string>>({});
  const [hintLoading, setHintLoading] = useState(false);
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeOutput, setCodeOutput] = useState<{ [key: string]: { output: string; error: string | null } }>({});

  // Webcam & Keystroke Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keystrokeData = useRef<{ lastTime: number; intervals: number[] }>({ lastTime: 0, intervals: [] });
  const aiMonitoringInterval = useRef<any>(null);

  // Fetch Test Data
  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) return;
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (testDoc.exists()) {
          const data = testDoc.data();
          setTest({ id: testDoc.id, ...data });
          setTimeLeft(data.duration * 60);
        } else {
          toast.error('Test not found');
          navigate('/student');
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('Failed to load test');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId, navigate]);

  // Anti-cheating: Strict Context Menu & DevTools Blocking
  useEffect(() => {
    const blockShortcuts = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toUpperCase() === 'U')) {
        e.preventDefault();
        toast.error('Developer tools and shortcuts are strictly prohibited.');
      }
    };
    const blockContext = (e: MouseEvent) => e.preventDefault();
    
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('contextmenu', blockContext);
    return () => {
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('contextmenu', blockContext);
    };
  }, []);

  // Anti-cheating: Strict Tab Switch Detection
  useEffect(() => {
    if (!test || isSubmitted) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const newCount = warningCount + 1;
        setWarningCount(newCount);
        
        // Log alert to database
        try {
          await addDoc(collection(db, 'alerts'), {
            testId,
            studentId: user?.uid,
            studentName: profile?.name,
            teacherId: test.teacherId,
            type: 'tab_switch',
            timestamp: serverTimestamp(),
            details: `Warning #${newCount}: User switched tabs/minimized window.`
          });
        } catch (e) {
          console.error('Failed to log alert:', e);
        }

        if (newCount >= 3) {
          toast.error('Test automatically submitted due to severe isolation violations.');
          handleSubmit();
        } else {
          toast.error(`Warning: Tab switch detected! Window unfocused. (${newCount}/3)`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [test, isSubmitted, warningCount, testId, user, profile]);

  // Anti-cheating: Strict Fullscreen Enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && !isSubmitted && test) {
        toast.error('You exited fullscreen Mode. Final test submission sequence initiated.');
        handleSubmit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isSubmitted, test]);

  // Anti-cheating: Webcam Monitoring
  useEffect(() => {
    if (!isFullscreen || isSubmitted || !test) return;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        toast.error('Webcam access is required for this test.');
      }
    };

    startWebcam();

    // AI Monitoring Loop (every 60 seconds)
    aiMonitoringInterval.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !user) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

      try {
        const token = user ? await user.getIdToken() : '';
        const response = await fetch('/api/ai/webcam-monitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ image: base64Image, testId })
        });

        const result = await response.json();
        if (result.violation) {
          toast.warning(`Integrity Alert: ${result.reason}`);
          await addDoc(collection(db, 'alerts'), {
            testId,
            studentId: user.uid,
            studentName: profile?.name,
            teacherId: test.teacherId,
            type: 'ai_monitoring',
            timestamp: serverTimestamp(),
            details: `AI Violation Detected: ${result.reason}`
          });
        }
      } catch (err) {
        console.error('AI Monitoring error:', err);
      }
    }, 60000);

    return () => {
      if (aiMonitoringInterval.current) clearInterval(aiMonitoringInterval.current);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isFullscreen, isSubmitted, test, user, profile, testId]);

  // Anti-cheating: Keystroke Analysis
  const handleKeystroke = (e: React.KeyboardEvent) => {
    const now = Date.now();
    if (keystrokeData.current.lastTime > 0) {
      const interval = now - keystrokeData.current.lastTime;
      keystrokeData.current.intervals.push(interval);
      
      // Basic burst detection: if many keys are hit in very short succession
      if (keystrokeData.current.intervals.length > 20) {
        const recent = keystrokeData.current.intervals.slice(-20);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        if (avg < 30) { // Unnaturally fast typing (less than 30ms between keys)
          console.warn('Suspicious typing speed detected');
          // We could log this as an alert if it persists
        }
        keystrokeData.current.intervals = recent;
      }
    }
    keystrokeData.current.lastTime = now;
  };

  // Timer
  useEffect(() => {
    if (!test || isSubmitted || timeLeft <= 0) {
      if (timeLeft <= 0 && test && !isSubmitted) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, test, isSubmitted]);

  // Disable Copy/Paste
  useEffect(() => {
    const handleCopyPaste = (e: any) => {
      e.preventDefault();
      toast.error('Copy/Paste is disabled during the test.');
    };
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const requestHint = async (qId: string, qText: string, qType: string) => {
    if (hints[qId]) return;
    setHintLoading(true);
    try {
      const hint = await getAIHint(qText, qType);
      setHints(prev => ({ ...prev, [qId]: hint }));
      toast.success('AI Hint received!');
    } catch (error) {
      toast.error('Failed to get hint. Please try again.');
    } finally {
      setHintLoading(false);
    }
  };

  const handleRunCode = async (qId: string, code: string) => {
    if (!code) return;
    setCodeRunning(true);
    try {
      const token = user ? await user.getIdToken() : '';
      const language = test.questions[currentQuestion].language || 'javascript'; // Default to javascript if unspecified in older tests
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language, code }),
      });
      
      const textResult = await response.text();
      let result;
      try {
        result = JSON.parse(textResult);
      } catch (e) {
        console.error('Non-JSON response:', textResult);
        throw new Error('Invalid JSON response from server');
      }

      setCodeOutput(prev => ({ ...prev, [qId]: result }));
      if (result.error) {
        toast.error('Execution encountered an error.');
      } else {
        toast.success('Code executed successfully!');
      }
    } catch (error) {
      console.error('Execution error:', error);
      toast.error('Failed to connect to execution server: ' + (error as Error).message);
    } finally {
      setCodeRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting || isSubmitted) return;
    setSubmitting(true);

    try {
      // Calculate Score 
      let score = 0;
      
      // Auto-evaluate coding questions that haven't been run or need final validation
      const finalCodeOutputs = { ...codeOutput };
      
      for (const q of test.questions) {
        if (q.type === 'mcq' && answers[q.id] === q.correct) {
          score += 1;
        } else if (q.type === 'coding' && answers[q.id]) {
          // Check if we need to run it, or if it was already run successfully
          let isCorrect = false;
          
          try {
            const language = q.language || 'javascript';
            const response = await fetch('/api/execute-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ language, code: answers[q.id] }),
            });
            const textResult = await response.text();
            const result = JSON.parse(textResult);
            
            if (!result.error) {
              isCorrect = true;
            }
          } catch (err) {
            console.error('Final evaluation execution error:', err);
          }
          
          if (isCorrect) {
            score += 1;
          }
        }
      }

      const accuracy = (score / test.questions.length) * 100;

      const answersArray = test.questions.map((q: any) => ({
        questionId: q.id,
        answer: answers[q.id] !== undefined ? answers[q.id] : null
      }));

      await addDoc(collection(db, 'submissions'), {
        testId,
        testTitle: test.title,
        studentId: user?.uid,
        studentName: profile?.name,
        studentEmail: user?.email,
        answers: answersArray,
        score,
        totalQuestions: test.questions.length,
        accuracy,
        timeTaken: (test.duration * 60) - timeLeft,
        submittedAt: serverTimestamp(),
        teacherId: test.teacherId
      });

      setIsSubmitted(true);
      toast.success('Test submitted successfully!');
      
      // Exit fullscreen after submission
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      setTimeout(() => navigate(`/results/${testId}`), 3000);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(err => {
      toast.error('Could not enter fullscreen mode.');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!isFullscreen && !isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 border border-white/10 rounded-[32px] p-10 text-center backdrop-blur-xl shadow-2xl"
        >
          <div className="w-20 h-20 bg-violet-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Maximize2 className="w-10 h-10 text-violet-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Ready to Start?</h1>
          <p className="text-white/50 mb-10 leading-relaxed">
            Test: <span className="text-white font-bold">{test.title}</span><br/>
            Duration: {test.duration} minutes<br/><br/>
            To ensure academic integrity, this test must be taken in fullscreen mode. 
            Tab switching and copy-pasting are strictly prohibited.
          </p>
          <button
            onClick={enterFullscreen}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 group"
          >
            Enter Fullscreen & Start
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/10 rounded-[32px] p-10 text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Test Submitted!</h1>
          <p className="text-white/50 mb-8">
            Your responses have been securely logged. Redirecting to your dashboard...
          </p>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
              className="h-full bg-emerald-500"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = test.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Test Header */}
      <header className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-3xl px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display uppercase tracking-tighter text-xl leading-none">CampusRank</h1>
              <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.3em]">Secure Protocol v2.5</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-white/10 hidden md:block" />
          
          <div className="hidden md:block">
            <h2 className="text-sm font-mono font-bold text-white/40 uppercase tracking-widest mb-1">Active Assessment</h2>
            <p className="font-display uppercase tracking-tighter text-2xl text-white/90 truncate max-w-md">{test.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em] mb-1">Time Remaining</span>
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${
              timeLeft < 300 
                ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/20 animate-pulse' 
                : 'bg-white/5 border-white/10 text-white'
            }`}>
              <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'animate-spin-slow' : 'text-white/40'}`} />
              <span className="font-mono font-bold text-2xl tracking-tighter">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-10 py-4 bg-white text-black font-display uppercase tracking-tighter text-xl rounded-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95 shadow-2xl shadow-white/5"
          >
            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            Finalize
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Question Navigator */}
        <aside className="w-96 border-r border-white/5 p-10 overflow-y-auto hidden xl:flex flex-col bg-black/20">
          <div className="mb-12">
            <h3 className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.4em] mb-8">Progress Matrix</h3>
            <div className="grid grid-cols-5 gap-3">
              {test.questions.map((q: any, idx: number) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center font-display text-xl transition-all border relative group overflow-hidden ${
                    currentQuestion === idx 
                      ? 'bg-white border-white text-black shadow-2xl shadow-white/20 scale-110 z-10' 
                      : answers[q.id] !== undefined
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                        : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  {idx + 1}
                  {answers[q.id] !== undefined && currentQuestion !== idx && (
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8 mt-auto">
            {/* Integrity Status */}
            <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">Integrity Status</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-white/40 font-medium">Warning Threshold</span>
                  <span className="text-lg font-display text-white">{warningCount}/3</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(warningCount / 3) * 100}%` }}
                    className={`h-full transition-colors duration-500 ${warningCount >= 2 ? 'bg-red-500' : 'bg-amber-500'}`}
                  />
                </div>
                <p className="text-[10px] text-white/30 leading-relaxed uppercase tracking-wider font-medium">
                  Exceeding the threshold will trigger immediate protocol termination.
                </p>
              </div>
            </div>

            {/* Webcam Preview */}
            <div className="rounded-[32px] overflow-hidden border border-white/10 bg-black aspect-video relative group shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-80 transition-all duration-700 scale-110 group-hover:scale-100"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-scan" />
                <div className="absolute inset-0 border-[20px] border-black/20" />
              </div>

              <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="text-[9px] font-mono font-bold text-white/60 uppercase tracking-[0.2em]">Live Bio-Metric Feed</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Question Area */}
        <main className="flex-1 p-12 lg:p-24 overflow-y-auto relative">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-16"
            >
              <div className="flex items-center gap-6">
                <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em]">
                    Module {currentQuestion + 1} of {test.questions.length}
                  </span>
                </div>
                <div className="px-6 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.4em]">
                    {currentQ.type}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start gap-6">
                <h1 className="text-4xl md:text-5xl font-display uppercase tracking-tighter leading-[0.95] text-white/90">
                  {currentQ.question}
                </h1>
                
                <button 
                  onClick={() => requestHint(currentQ.id, currentQ.question, currentQ.type)}
                  disabled={!!hints[currentQ.id] || hintLoading}
                  className="px-6 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-full flex items-center gap-2 transition-all font-mono text-xs uppercase tracking-widest disabled:opacity-50 flex-shrink-0"
                >
                  {hintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {hints[currentQ.id] ? 'Hint Used' : 'Get AI Hint'}
                </button>
              </div>

              {hints[currentQ.id] && (
                <div className="p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 mb-1">AI Assistant Hint</h4>
                    <p className="text-white/80 leading-relaxed font-mono text-sm">{hints[currentQ.id]}</p>
                  </div>
                </div>
              )}

              {/* MCQ Options */}
              {currentQ.type === 'mcq' && (
                <div className="grid grid-cols-1 gap-6">
                  {currentQ.options?.map((option: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(currentQ.id, idx)}
                      className={`w-full p-10 rounded-[32px] border text-left transition-all flex items-center justify-between group relative overflow-hidden ${
                        answers[currentQ.id] === idx 
                          ? 'bg-white border-white text-black shadow-2xl shadow-white/10 scale-[1.02]' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-8 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display text-2xl transition-all ${
                          answers[currentQ.id] === idx ? 'bg-black text-white' : 'bg-white/10 text-white/40'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-xl font-bold tracking-tight">{option}</span>
                      </div>
                      
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all relative z-10 ${
                        answers[currentQ.id] === idx ? 'border-black bg-black' : 'border-white/10'
                      }`}>
                        {answers[currentQ.id] === idx && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>

                      {answers[currentQ.id] === idx && (
                        <motion.div 
                          layoutId="active-bg"
                          className="absolute inset-0 bg-white z-0"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {currentQ.type === 'coding' && (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative group flex flex-col">
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="bg-white/5 px-10 py-6 border-b border-white/10 flex items-center justify-between z-10 relative backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500/40" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                      <span className="ml-4 text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em]">
                        Environment: {currentQ.language?.toUpperCase() || 'NODE.JS'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleRunCode(currentQ.id, answers[currentQ.id] || '')}
                        disabled={codeRunning}
                        className="px-6 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center gap-2 hover:bg-emerald-500/30 transition-all font-mono font-bold text-[10px] uppercase tracking-widest disabled:opacity-50"
                      >
                        {codeRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Run Code
                      </button>
                    </div>
                  </div>
                  
                  <textarea
                    className="w-full min-h-[300px] h-[400px] bg-transparent p-10 font-mono text-base focus:outline-none resize-y text-indigo-300 placeholder:text-white/5 leading-relaxed relative z-10 selection:bg-indigo-500/30"
                    placeholder={currentQ.placeholder || '// WRITING YOUR SOLUTION HERE...\n// Use standard input/output depending on the challenge.\n// Example (JS): console.log("Hello");\n// Example (Python): print("Hello")'}
                    value={answers[currentQ.id] || ''}
                    onKeyDown={(e) => {
                      handleKeystroke(e);
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const target = e.target as HTMLTextAreaElement;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const newAnswer = (answers[currentQ.id] || '').substring(0, start) + '  ' + (answers[currentQ.id] || '').substring(end);
                        handleAnswer(currentQ.id, newAnswer);
                        setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
                      }
                    }}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                    spellCheck="false"
                  />

                  {codeOutput[currentQ.id] && (
                    <div className="bg-black/80 border-t border-white/5 p-8 relative z-10 max-h-[250px] overflow-y-auto">
                      <div className="flex items-center gap-3 mb-4">
                        <Terminal className={`w-4 h-4 ${codeOutput[currentQ.id].error ? 'text-red-500' : 'text-emerald-500'}`} />
                        <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em]">Console Output</span>
                      </div>
                      <pre className={`font-mono text-sm leading-relaxed whitespace-pre-wrap ${
                        codeOutput[currentQ.id].error ? 'text-red-400' : 'text-white/80'
                      }`}>
                        {codeOutput[currentQ.id].error || codeOutput[currentQ.id].output || 'Program exited with empty output.'}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Subjective Area */}
              {currentQ.type === 'subjective' && (
                <div className="relative group">
                  <textarea
                    className="w-full h-80 bg-white/5 border border-white/10 rounded-[40px] p-12 text-2xl font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-white/5 leading-relaxed"
                    placeholder="COMPOSE YOUR DETAILED RESPONSE..."
                    value={answers[currentQ.id] || ''}
                    onKeyDown={handleKeystroke}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  />
                  <div className="absolute bottom-8 right-10 text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">
                    Markdown Supported
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-24 flex items-center justify-between">
                <button
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                  className="flex items-center gap-4 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-display uppercase tracking-tighter text-xl hover:bg-white/10 transition-all disabled:opacity-10 disabled:cursor-not-allowed active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                  Previous
                </button>

                <div className="flex items-center gap-6">
                  <button className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-500/10 hover:border-red-500/30 transition-all text-white/20 hover:text-red-500 group">
                    <Flag className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  </button>
                  <button
                    onClick={() => {
                      if (currentQuestion < test.questions.length - 1) {
                        setCurrentQuestion(prev => prev + 1);
                      } else {
                        handleSubmit();
                      }
                    }}
                    className="flex items-center gap-4 px-12 py-5 bg-white text-black font-display uppercase tracking-tighter text-2xl rounded-2xl hover:scale-105 transition-all group active:scale-95 shadow-2xl shadow-white/5"
                  >
                    {currentQuestion === test.questions.length - 1 ? 'Finalize' : 'Proceed'}
                    <ChevronRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
