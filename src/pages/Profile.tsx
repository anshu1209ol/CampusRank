import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CreditCard, User, Mail, Building, Clock, ArrowRight, Activity, Zap, Star } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  // We'll mock the tier for display unless it exists on profile 
  // Let profile have tier or fallback to 'free'
  const userTier = (profile as any)?.tier || 'free'; 

  const isPremium = userTier === 'premium';
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Member since recently';
    return `Member since ${new Date(dateString).toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl md:text-5xl font-display uppercase tracking-tighter">My Profile</h1>
          <div className="flex gap-4">
            <Link 
              to="/settings"
              className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest flex items-center gap-2"
            >
              Settings
            </Link>
            <button 
              onClick={() => navigate(-1)}
              className="hidden md:block px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
            >
              Go Back
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Identity Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1 border border-white/10 rounded-[3rem] p-8 bg-white/[0.02] flex flex-col items-center text-center relative overflow-hidden"
          >
            {isPremium && (
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink" />
            )}
            
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-5xl font-display shadow-2xl mb-6 relative">
              {profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              {isPremium && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#050505] rounded-full flex items-center justify-center border border-white/10">
                  <Star className="w-5 h-5 fill-neon-purple text-neon-purple" />
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-display uppercase mb-2">{profile?.name || 'User Name'}</h2>
            <p className="text-white/50 text-sm mb-6 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {profile?.email || user?.email}
            </p>
            
            <div className="w-full space-y-3 mb-8">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-xs uppercase tracking-widest text-white/40 font-bold">Role</span>
                <span className="text-sm font-bold capitalize">{profile?.role || 'Student'}</span>
              </div>
              
              {profile?.college && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs uppercase tracking-widest text-white/40 font-bold">College</span>
                  <span className="text-sm font-bold">{profile?.college}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-xs uppercase tracking-widest text-white/40 font-bold">Joined</span>
                <span className="text-sm font-bold">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            
            <div className="mt-auto w-full">
               <div className="w-full flex items-center justify-center gap-2 text-xs font-mono text-neon-green uppercase tracking-widest bg-emerald-500/10 py-3 rounded-full border border-emerald-500/20">
                 <Shield className="w-4 h-4" /> Account Secured
               </div>
            </div>
          </motion.div>

          {/* Subscription & Details */}
          <div className="md:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border border-white/10 rounded-[3rem] p-8 bg-white/[0.02] relative overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-neon-purple/20 blur-[100px] rounded-full point-events-none" />
              
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Current Plan</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-display uppercase">{isPremium ? 'Pro Tier' : 'Starter Free'}</span>
                    {isPremium ? (
                      <span className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/50 text-neon-purple text-xs font-bold uppercase tracking-widest rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-white/10 border border-white/20 text-white/70 text-xs font-bold uppercase tracking-widest rounded-full">
                        Basic
                      </span>
                    )}
                  </div>
                </div>
                
                {isPremium && (
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-neon-purple">Verified User</div>
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Premium Tier</div>
                  </div>
                )}
              </div>
              
              <p className="text-white/50 mb-8 max-w-md text-sm leading-relaxed">
                {isPremium 
                  ? "You have full access to advanced AI insights, unlimited testing, and priority support. Your next billing date is Oct 12, 2026."
                  : "Upgrade to PRO to unlock advanced analytics, unlimited benchmarking, and AI-powered personalized roadmaps."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!isPremium ? (
                  <Link to="/payment" className="btn-vibrant min-w-[200px]">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" /> UPGRADE TO PRO
                    </span>
                    <div className="btn-vibrant-inner" />
                  </Link>
                ) : (
                  <Link to="/payment" className="px-8 py-4 rounded-full border border-white/20 hover:bg-white/5 font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                    <CreditCard className="w-4 h-4" /> Manage Subscription
                  </Link>
                )}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-white/10 rounded-[3rem] p-8 bg-white/[0.02]"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold mb-1">Completed Assessment #{400 + i}</h4>
                      <p className="text-xs text-white/40 uppercase tracking-wider font-mono">2 Days Ago • Score: 92%</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
