import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Shield, BarChart3, Rocket, Target, Zap, Globe, Sparkles, ArrowRight, Play } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: <Shield className="w-8 h-8 text-neon-purple" />,
    title: 'IRONCLAD SECURITY',
    description: 'Multi-layer protection including tab switch detection, fullscreen enforcement, and AI-based behavior monitoring.',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-neon-blue" />,
    title: 'DEEP ANALYTICS',
    description: 'Comprehensive performance insights for students and detailed class heatmaps for teachers.',
  },
  {
    icon: <Target className="w-8 h-8 text-neon-green" />,
    title: 'SKILL BENCHMARKING',
    description: 'Evaluate your skills against college-wide and national standards with real-time rank tracking.',
  },
  {
    icon: <Zap className="w-8 h-8 text-neon-pink" />,
    title: 'INSTANT FEEDBACK',
    description: 'Get immediate results and topic-wise weakness analysis to focus your practice effectively.',
  },
  {
    icon: <Globe className="w-8 h-8 text-neon-blue" />,
    title: 'COMPANY TRACKS',
    description: 'Practice with company-specific preparation tracks designed by industry experts.',
  },
  {
    icon: <Sparkles className="w-8 h-8 text-neon-purple" />,
    title: 'AI RECOMMENDATIONS',
    description: 'Personalized test recommendations and resume scoring powered by advanced Gemini AI models.',
  },
];

const stats = [
  { label: 'Active Students', value: '50K+' },
  { label: 'Exams Conducted', value: '1.2M+' },
  { label: 'Partner Colleges', value: '200+' },
  { label: 'Skill Badges', value: '15K+' },
];

const colleges = [
  'Stanford University', 'MIT', 'IIT Bombay', 'Oxford University', 'Harvard', 'UC Berkeley', 'NTU Singapore', 'ETH Zurich'
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-blue/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-neon-purple mb-12 backdrop-blur-md animate-float">
              <Sparkles className="w-4 h-4" />
              THE FUTURE OF CAMPUS ASSESSMENTS IS HERE
            </div>
            
            <h1 className="text-7xl md:text-[10rem] font-display leading-[0.85] tracking-tighter mb-12 uppercase">
              BENCHMARK <br />
              <span className="vibrant-text">YOUR SKILLS</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
              The ultimate high-performance assessment platform. 
              Advanced anti-cheating, real-time analytics, and AI-powered insights for the next generation of talent.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link
                to="/signup"
                className="btn-vibrant group min-w-[240px]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  GET STARTED NOW
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="btn-vibrant-inner" />
              </Link>
              
              <button
                className="group flex items-center gap-4 px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-all backdrop-blur-md"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-neon-purple transition-colors">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <span className="font-semibold tracking-widest text-sm">WATCH DEMO</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="py-12 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...colleges, ...colleges].map((college, i) => (
            <div key={i} className="mx-12 text-2xl font-display text-white/20 uppercase tracking-widest">
              {college}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-6xl md:text-8xl font-display mb-4 vibrant-text">{stat.value}</div>
              <div className="text-sm font-semibold text-white/40 uppercase tracking-[0.3em]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-32">
            <div className="max-w-2xl">
              <h2 className="text-6xl md:text-8xl font-display uppercase leading-none mb-8">
                BUILT FOR THE <br />
                <span className="text-neon-purple">MODERN CAMPUS</span>
              </h2>
              <p className="text-2xl text-white/50 leading-relaxed">
                Everything you need to conduct, monitor, and analyze assessments with precision and integrity.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center animate-spin-slow">
                <Rocket className="w-12 h-12 text-white/20" />
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="card-brutal group"
              >
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-neon-purple/20 transition-all duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-display mb-6 tracking-wider">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="py-32 px-6 relative border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-5xl md:text-7xl font-display uppercase leading-none mb-8">
              DATA-DRIVEN <br />
              <span className="text-neon-blue">INSIGHTS</span>
            </h2>
            <p className="text-xl text-white/50 leading-relaxed mb-10">
              Go beyond simple scores. Our AI-powered analytics engine provides granular insights into student performance, identifying weaknesses and predicting placement readiness with unparalleled accuracy.
            </p>
            <ul className="space-y-6">
              {[
                'Real-time class performance heatmaps',
                'Algorithmic topic weakness detection',
                'Historical growth trajectories',
                'Automated placement probability scores'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-lg font-medium text-white/80">
                  <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-neon-blue" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/10 blur-[100px] rounded-full" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">Cohort Performance</h4>
                <div className="text-4xl font-display mt-2">84.2%</div>
              </div>
              <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
                +12% Growth
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Data Structures', prog: 85, color: 'bg-neon-purple' },
                { label: 'Algorithms', prog: 72, color: 'bg-neon-blue' },
                { label: 'System Design', prog: 64, color: 'bg-neon-pink' },
                { label: 'Databases', prog: 91, color: 'bg-neon-green' }
              ].map((skill, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-white/60">{skill.label}</span>
                    <span>{skill.prog}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.prog}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      viewport={{ once: true }}
                      className={`h-full ${skill.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-display uppercase leading-none mb-6">
            TRANSPARENT <span className="text-neon-pink">PRICING</span>
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-20">
            Simple, predictable pricing designed to scale with your institution, whether you are a small college or a massive university network.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { title: 'STARTER', price: 'Free', color: 'border-white/10 hover:border-white/30', features: ['Up to 100 Students', 'Basic Analytics', 'Standard Support', '5 Active Tests'] },
              { title: 'PRO', price: '$499/mo', color: 'border-neon-purple/50 bg-neon-purple/5 transform scale-105', active: true, features: ['Up to 2,000 Students', 'Advanced AI Insights', 'Priority Support', 'Unlimited Tests', 'Custom Branding'] },
              { title: 'ENTERPRISE', price: 'Custom', color: 'border-white/10 hover:border-white/30', features: ['Unlimited Students', 'API Access', 'Dedicated Account Manager', 'SLA Guarantee', 'On-Premise Option'] }
            ].map((plan, idx) => (
              <div key={idx} className={`rounded-[3rem] border p-12 transition-all duration-300 relative ${plan.color}`}>
                {plan.active && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-neon-purple text-white text-xs font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-display uppercase tracking-widest mb-4">{plan.title}</h3>
                <div className="text-5xl font-display mb-8">{plan.price}</div>
                <ul className="space-y-4 mb-12">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/70 font-medium">
                      <Shield className="w-5 h-5 text-neon-green" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/payment" className={`block w-full text-center py-4 rounded-full font-bold uppercase tracking-widest transition-all ${plan.active ? 'bg-neon-purple text-white hover:bg-white hover:text-black' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}>
                  Choose Plan
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10 rotate-12">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl md:text-7xl font-display uppercase leading-none mb-8">
            ABOUT <span className="vibrant-text">CAMPUSRANK</span>
          </h2>
          <p className="text-2xl text-white/60 leading-relaxed font-medium">
            CampusRank was born from a simple idea: that institutional assessments shouldn't be archaic. 
            We are a team of educators and engineers dedicated to bringing high-end technological innovation to universities worldwide. 
            By merging sophisticated anti-cheating protocols with beautiful, intuitive design and predictive AI, we ensure meritocracy always wins.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[4rem] overflow-hidden p-12 md:p-32 text-center border border-white/10 bg-white/[0.02]">
            <div className="absolute inset-0 mesh-gradient opacity-20" />
            <div className="relative z-10">
              <h2 className="text-6xl md:text-9xl font-display uppercase mb-12 leading-none">
                READY TO <br />
                <span className="vibrant-text">ELEVATE</span> YOUR CAMPUS?
              </h2>
              <p className="text-2xl text-white/60 mb-16 max-w-3xl mx-auto font-medium">
                Join hundreds of colleges already using CampusRank to benchmark skills and ensure academic integrity.
              </p>
              <Link
                to="/signup"
                className="btn-vibrant inline-flex min-w-[280px]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  GET STARTED NOW
                  <ChevronRight className="w-6 h-6" />
                </span>
                <div className="btn-vibrant-inner" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-24">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-neon-purple rounded-2xl flex items-center justify-center rotate-12">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-4xl font-display uppercase tracking-tighter">CampusRank</span>
            </Link>
            <p className="text-xl text-white/40 max-w-md mb-12 leading-relaxed">
              The world's most advanced skill benchmarking and assessment platform for higher education.
            </p>
            <div className="flex gap-6">
              {['TW', 'IG', 'LI', 'GH'].map((social) => (
                <div key={social} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-neon-purple hover:border-neon-purple cursor-pointer transition-all font-display text-sm">
                  {social}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-display text-xl mb-10 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-6 text-lg text-white/40">
              <li><a href="#features" className="hover:text-neon-purple transition-colors">Features</a></li>
              <li><a href="#analytics" className="hover:text-neon-purple transition-colors">Analytics</a></li>
              <li><a href="#pricing" className="hover:text-neon-purple transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-xl mb-10 uppercase tracking-widest">Company</h4>
            <ul className="space-y-6 text-lg text-white/40">
              <li><a href="#about" className="hover:text-neon-purple transition-colors">About Us</a></li>
              <li><Link to="/signup" className="hover:text-neon-purple transition-colors">Careers</Link></li>
              <li><Link to="/signup" className="hover:text-neon-purple transition-colors">Blog</Link></li>
              <li><a href="#about" className="hover:text-neon-purple transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-white/20 font-medium">
          <p>© 2026 CAMPUSRANK. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-12">
            <a href="#" className="hover:text-white transition-colors uppercase tracking-widest text-xs">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors uppercase tracking-widest text-xs">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
