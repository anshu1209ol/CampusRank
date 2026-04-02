import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, Lock, ArrowRight, Chrome, Loader2, GraduationCap, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/src/lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<'student' | 'teacher'>('student');
  const navigate = useNavigate();

  const handleRoleRedirect = (role: string) => {
    switch (role) {
      case 'admin': navigate('/admin'); break;
      case 'teacher': navigate('/teacher'); break;
      default: navigate('/student');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role !== loginRole) {
          toast.error(`INCORRECT ROLE SELECTED. PLEASE SWITCH TO ${userData.role.toUpperCase()}.`);
          return;
        }
        handleRoleRedirect(userData.role);
        toast.success('WELCOME BACK!');
      } else {
        toast.error('PROFILE NOT FOUND. PLEASE SIGN UP.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'FAILED TO LOG IN');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role !== loginRole) {
          toast.error(`INCORRECT ROLE SELECTED. PLEASE SWITCH TO ${userData.role.toUpperCase()}.`);
          return;
        }
        handleRoleRedirect(userData.role);
        toast.success('LOGGED IN WITH GOOGLE!');
      } else {
        toast.error('ACCOUNT NOT FOUND. PLEASE SIGN UP FIRST.');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'GOOGLE LOGIN FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-20" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-4 mb-6 group">
            <div className="w-14 h-14 bg-neon-purple rounded-2xl flex items-center justify-center shadow-2xl shadow-neon-purple/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <Rocket className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-5xl font-display uppercase tracking-tighter mb-4">WELCOME BACK</h1>
          <p className="text-lg text-white/40 font-medium uppercase tracking-widest">ENTER YOUR CREDENTIALS TO LOGIN</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-purple/20 blur-[80px] rounded-full" />
          
          {/* Role Switcher */}
          <div className="flex p-2 bg-white/5 rounded-[1.5rem] mb-8 border border-white/10 relative z-10 w-full">
            <button
              type="button"
              onClick={() => setLoginRole('student')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[1rem] transition-all uppercase tracking-widest font-semibold text-xs ${
                loginRole === 'student' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setLoginRole('teacher')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[1rem] transition-all uppercase tracking-widest font-semibold text-xs ${
                loginRole === 'teacher' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Teacher
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em] ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all disabled:opacity-50 text-base font-medium"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em]">Password</label>
                <a href="#" className="text-[10px] font-semibold text-neon-purple hover:text-neon-pink transition-colors uppercase tracking-widest">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all disabled:opacity-50 text-base font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-vibrant w-full py-4 text-sm mt-4 group"
            >
              <span className="relative z-10 flex items-center gap-3">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIGN IN NOW'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
              </span>
              <div className="btn-vibrant-inner" />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-6 relative z-10">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">OR CONTINUE WITH</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-4 hover:bg-white/10 transition-all group disabled:opacity-50"
            >
              <Chrome className="w-5 h-5 group-hover:text-neon-purple transition-colors" />
              <span className="text-xs font-semibold uppercase tracking-widest">Google</span>
            </button>
            <button
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-4 hover:bg-white/10 transition-all group disabled:opacity-50"
            >
              <Rocket className="w-5 h-5 group-hover:text-neon-blue transition-colors" />
              <span className="text-xs font-semibold uppercase tracking-widest">GitHub</span>
            </button>
          </div>
        </div>

        <p className="text-center mt-12 text-white/40 font-medium uppercase tracking-widest text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white font-bold hover:text-neon-purple transition-colors">
            SIGN UP FOR FREE
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
