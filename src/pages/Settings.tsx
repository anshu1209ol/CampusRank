import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Link2, Bell, Shield, ArrowLeft, Code2, Terminal, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'notifications' | 'security'>('integrations');
  
  // Integration States
  const [githubUsername, setGithubUsername] = useState('johndoe_gh');
  const [isGithubConnected, setIsGithubConnected] = useState(true);
  const [resumeName, setResumeName] = useState('');
  const [isResumeUploaded, setIsResumeUploaded] = useState(false);

  // Settings State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  const toggleGithub = () => setIsGithubConnected(!isGithubConnected);
  const toggleResume = () => setIsResumeUploaded(!isResumeUploaded);

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12 uppercase tracking-widest text-sm font-bold"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          
          <h1 className="text-4xl font-display uppercase tracking-tighter mb-8">Settings</h1>
          
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                    isActive 
                      ? 'bg-neon-purple text-white' 
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-white/10 rounded-[3rem] p-8 md:p-12 bg-white/[0.02] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-display uppercase tracking-widest mb-2">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-white/50 text-sm">
                  {activeTab === 'integrations' && 'Connect external platforms to sync your progress automatically.'}
                  {activeTab === 'profile' && 'Manage your account information and preferences.'}
                  {activeTab === 'notifications' && 'Control how and when you receive alerts.'}
                  {activeTab === 'security' && 'Update your password and secure your account.'}
                </p>
              </div>
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn-vibrant min-w-[140px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : saveSuccess ? (
                    <><CheckCircle2 className="w-4 h-4" /> SAVED</>
                  ) : (
                    <><Save className="w-4 h-4" /> SAVE</>
                  )}
                </span>
                <div className="btn-vibrant-inner" />
              </button>
            </div>

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-8">
                {/* GitHub Analyzer Integration */}
                <div className="border border-white/10 rounded-3xl p-6 bg-[#0a0a0a] relative overflow-hidden group hover:border-[#2ea043]/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#2ea043]/5 blur-[50px] rounded-full point-events-none group-hover:bg-[#2ea043]/10 transition-colors" />
                  
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#2ea043]/10 border border-[#2ea043]/20 flex items-center justify-center shrink-0">
                        <Terminal className="w-8 h-8 text-[#2ea043]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display uppercase mb-1">GitHub Analyzer</h3>
                        <p className="text-white/50 text-sm max-w-sm">
                          Connect your GitHub account to analyze your repositories, commit history, and tech stack using our AI engine.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                      <button 
                        onClick={toggleGithub}
                        className={`w-full md:w-auto px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs transition-all border ${
                          isGithubConnected 
                            ? 'bg-[#2ea043]/10 border-[#2ea043]/20 text-[#2ea043] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500'
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        {isGithubConnected ? 'Disconnect' : 'Connect GitHub'}
                      </button>
                      
                      {isGithubConnected && (
                        <div className="flex items-center gap-2 text-xs font-mono text-[#2ea043]">
                          <CheckCircle2 className="w-3 h-3" /> Synced 2 hrs ago
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isGithubConnected && (
                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">GitHub Username</label>
                        <input 
                          type="text" 
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-[#2ea043] transition-colors"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors">
                          <Terminal className="w-4 h-4" /> Run Deep Analysis
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resume Analyzer Integration */}
                <div className="border border-white/10 rounded-3xl p-6 bg-[#0a0a0a] relative overflow-hidden group hover:border-neon-purple/30 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 blur-[50px] rounded-full point-events-none group-hover:bg-neon-purple/10 transition-colors" />
                  
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center shrink-0">
                        <Code2 className="w-8 h-8 text-neon-purple" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display uppercase mb-1">Resume Analyzer</h3>
                        <p className="text-white/50 text-sm max-w-sm">
                          Upload your resume for an AI-powered ATS (Applicant Tracking System) check and feedback to optimize your profile.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                      <button 
                        onClick={toggleResume}
                        className={`w-full md:w-auto px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs transition-all border ${
                          isResumeUploaded 
                            ? 'bg-neon-purple/10 border-neon-purple/20 text-neon-purple hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500'
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        {isResumeUploaded ? 'Remove Resume' : 'Upload Resume'}
                      </button>
                    </div>
                  </div>
                  
                  {isResumeUploaded && (
                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-neon-purple/20 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-neon-purple" />
                            </div>
                            <span className="text-sm font-mono text-white/70">johndoe_resume_2026.pdf</span>
                          </div>
                          <span className="text-xs uppercase font-bold text-neon-purple tracking-widest">ATS Match: 84%</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors ml-auto md:ml-0">
                          <Code2 className="w-4 h-4" /> View AI Feedback
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab Placeholder */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={profile?.name || ''}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-neon-purple transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={profile?.email || ''}
                      readOnly
                      className="w-full bg-[#050505] border border-white/5 rounded-2xl p-4 text-sm text-white/50 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Bio</label>
                  <textarea 
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-neon-purple transition-colors resize-none"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Other Tabs (Generic Content) */}
            {(activeTab === 'notifications' || activeTab === 'security') && (
              <div className="flex items-center justify-center p-12 text-white/30 border border-white/5 rounded-3xl border-dashed">
                <span className="font-mono text-sm uppercase tracking-widest">More settings coming soon</span>
              </div>
            )}
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
