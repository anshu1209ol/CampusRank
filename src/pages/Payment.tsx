import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CreditCard, ArrowRight, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Payment() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceed = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Mock successful payment, redirect back to profile or dashboard
      setIsProcessing(false);
      navigate('/profile');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16 flex flex-col md:flex-row gap-12">
      {/* Plan Details & Back Button */}
      <div className="flex-1 max-w-xl">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12 uppercase tracking-widest text-sm font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Profile
        </button>
        
        <h1 className="text-4xl md:text-5xl font-display uppercase tracking-tighter mb-4">Complete Your Upgrade</h1>
        <p className="text-white/50 text-lg leading-relaxed mb-12">
          Unlock the full potential of CampusRank with our premium tiers. Empower your campus with advanced data and analytics.
        </p>
        
        <div className="space-y-6">
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`p-8 rounded-[2rem] border cursor-pointer transition-all duration-300 relative ${selectedPlan === 'pro' ? 'border-neon-purple/50 bg-neon-purple/5' : 'border-white/10 hover:border-white/20'}`}
          >
            {selectedPlan === 'pro' && (
              <div className="absolute top-4 right-4 text-neon-purple">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-2xl font-display uppercase tracking-widest">PRO TIER</h3>
            </div>
            <div className="text-4xl font-display mb-6">$499<span className="text-xl text-white/50">/mo</span></div>
            <ul className="space-y-3">
              {['Up to 2,000 Students', 'Advanced AI Insights', 'Priority Support', 'Unlimited Tests', 'Custom Branding'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white/70 font-medium text-sm">
                  <Shield className="w-4 h-4 text-neon-green" /> {f}
                </li>
              ))}
            </ul>
          </div>
          
          <div 
            onClick={() => setSelectedPlan('enterprise')}
            className={`p-8 rounded-[2rem] border cursor-pointer transition-all duration-300 relative ${selectedPlan === 'enterprise' ? 'border-neon-blue/50 bg-neon-blue/5' : 'border-white/10 hover:border-white/20'}`}
          >
            {selectedPlan === 'enterprise' && (
              <div className="absolute top-4 right-4 text-neon-blue">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-2xl font-display uppercase tracking-widest">ENTERPRISE</h3>
            </div>
            <div className="text-4xl font-display mb-6">Custom</div>
            <ul className="space-y-3">
              {['Unlimited Students', 'API Access', 'Dedicated Account Manager', 'SLA Guarantee', 'On-Premise Option'].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white/70 font-medium text-sm">
                  <Shield className="w-4 h-4 text-neon-green" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Details Form */}
      <div className="flex-1 max-w-xl self-start sticky top-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-white/10 rounded-[3rem] p-8 md:p-12 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 blur-[100px] rounded-full point-events-none" />
          
          <h2 className="text-2xl font-display uppercase tracking-widest mb-8">Payment Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Card Information</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000" 
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono focus:outline-none focus:border-neon-purple transition-colors placeholder:text-white/20"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Expiry Date</label>
                <input 
                  type="text" 
                  placeholder="MM/YY" 
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-neon-purple transition-colors placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">CVC</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="text" 
                    placeholder="123" 
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 pr-10 text-sm font-mono focus:outline-none focus:border-neon-purple transition-colors placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Cardholder Name</label>
              <input 
                type="text" 
                placeholder="JOHN DOE" 
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 text-sm font-display uppercase tracking-widest focus:outline-none focus:border-neon-purple transition-colors placeholder:text-white/20"
              />
            </div>
          </div>
          
          <div className="my-10 border-t border-white/10" />
          
          <div className="flex items-center justify-between mb-8">
            <span className="text-white/50 font-medium">Total Billed Today</span>
            <span className="text-3xl font-display">{selectedPlan === 'pro' ? '$499' : 'Let\'s Talk'}</span>
          </div>

          <button 
            type="button"
            onClick={handleProceed}
            disabled={isProcessing}
            className={`w-full relative group btn-vibrant ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-3 py-1">
              {isProcessing ? 'PROCESSING...' : `PROCEED SECURELY`}
              {!isProcessing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </span>
            {!isProcessing && <div className="btn-vibrant-inner" />}
          </button>
          
          <p className="text-center text-xs text-white/30 uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" /> Secure 256-bit SSL Encryption
          </p>
        </motion.div>
      </div>
    </div>
  );
}
