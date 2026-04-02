import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, Lock, ArrowRight, User, GraduationCap, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '@/src/lib/firebase';

export default function Signup() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('PASSWORD MUST BE AT LEAST 6 CHARACTERS');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        college,
        email,
        role,
        createdAt: new Date().toISOString(),
      });

      toast.success('ACCOUNT CREATED SUCCESSFULLY!');
      navigate(role === 'student' ? '/student' : '/teacher');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'FAILED TO CREATE ACCOUNT';
      
      if (error.code === 'auth/weak-password') {
        errorMessage = 'PASSWORD MUST BE AT LEAST 6 CHARACTERS';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'EMAIL IS ALREADY REGISTERED';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'INVALID EMAIL ADDRESS';
      } else if (error.message) {
        errorMessage = error.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim().toUpperCase();
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: any) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          role: role,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        });
        toast.success(`ACCOUNT CREATED AS ${role.toUpperCase()}!`);
      } else {
        toast.success('LOGGED IN SUCCESSFULLY!');
      }
      
      navigate(role === 'student' ? '/student' : '/teacher');
    } catch (error: any) {
      console.error('OAuth signup error:', error);
      toast.error('FAILED TO AUTHENTICATE');
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
          <h1 className="text-5xl font-display uppercase tracking-tighter mb-4">CREATE ACCOUNT</h1>
          <p className="text-lg text-white/40 font-medium uppercase tracking-widest">JOIN CAMPUSRANK AND START BENCHMARKING</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-purple/20 blur-[80px] rounded-full" />
          
          {/* Role Switcher */}
          <div className="flex p-2 bg-white/5 rounded-[1.5rem] mb-8 border border-white/10 relative z-10">
            <button
              onClick={() => setRole('student')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[1rem] transition-all uppercase tracking-widest font-semibold text-xs ${
                role === 'student' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Student
            </button>
            <button
              onClick={() => setRole('teacher')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[1rem] transition-all uppercase tracking-widest font-semibold text-xs ${
                role === 'teacher' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Teacher
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em] ml-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all disabled:opacity-50 text-base font-medium"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em] ml-2">College / Institution</label>
              <div className="relative">
                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all disabled:opacity-50 text-base font-medium"
                  placeholder="University of Technology"
                />
              </div>
            </div>

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
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em] ml-2">Password</label>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CREATE ACCOUNT'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
              </span>
              <div className="btn-vibrant-inner" />
            </button>
          </form>

          <div className="relative mt-12 mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0a0a0a] text-white/40 uppercase tracking-widest font-semibold">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button
              type="button"
              onClick={() => handleOAuthSignup(googleProvider)}
              disabled={loading}
              className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignup(githubProvider)}
              disabled={loading}
              className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </button>
          </div>
        </div>

        <p className="text-center mt-12 text-white/40 font-medium uppercase tracking-widest text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-bold hover:text-neon-purple transition-colors">
            LOG IN
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
