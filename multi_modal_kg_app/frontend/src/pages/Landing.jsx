import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, FileSearch, Network, ShieldCheck, Zap, UploadCloud, Database, MessageSquare } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const yOffset = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark selection:bg-primary-500 selection:text-white">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-400 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-secondary-400 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-accent-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navbar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass-nav py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-primary-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-500 transition-colors">How It Works</a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login" className="hidden md:block text-sm font-medium hover:text-primary-500 transition-colors">Sign In</Link>
            <Link to="/register" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary-500/30 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-8"
          >
            <Zap size={16} /> Introducing Graph RAG for Compliance
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight"
          >
            Transform Unstructured Compliance <br className="hidden md:block" />
            into <span className="gradient-text">Actionable Knowledge</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mb-12"
          >
            NoesisNet uses multi-modal Graph RAG to answer complex regulatory questions with zero hallucinations and full traceability. Secure, scalable, and enterprise-ready.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-primary-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full glass-card border-slate-200 dark:border-slate-700 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
              Learn More
            </a>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-200/50 dark:border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for Compliance Intelligence</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">A complete end-to-end pipeline from document ingestion to zero-hallucination answers.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <FileSearch size={32} />, title: 'Multi-Modal Ingestion', desc: 'Process PDFs, Audio, Spreadsheets, and Images natively.' },
                { icon: <Network size={32} />, title: 'Knowledge Graph RAG', desc: 'Combines vector search with graph traversal for ultimate precision.' },
                { icon: <BrainCircuit size={32} />, title: 'Entity Extraction', desc: 'Automatic recognition of regulations, organizations, and dates.' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 group hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How NoesisNet Works</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">From raw, chaotic documents to structured, cited answers in three simple steps.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary-500/0 via-primary-500/20 to-secondary-500/0"></div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-primary-500 mb-6 shadow-xl relative z-10">
                  <UploadCloud size={40} />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Upload & Extract</h3>
                <p className="text-slate-600 dark:text-slate-400">Drag and drop PDFs, Audio, Images, or Spreadsheets. We automatically transcribe, OCR, and parse the raw text.</p>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="relative text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-primary-500 mb-6 shadow-xl relative z-10">
                  <Database size={40} />
                </div>
                <h3 className="text-xl font-bold mb-3">2. Synthesize Graph</h3>
                <p className="text-slate-600 dark:text-slate-400">Entities and relationships are extracted via NLP to build a strict Knowledge Graph, alongside dense semantic vectors.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="relative text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-secondary-500 mb-6 shadow-xl relative z-10">
                  <MessageSquare size={40} />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Graph RAG Q&A</h3>
                <p className="text-slate-600 dark:text-slate-400">Ask complex regulatory questions. Our AI Agent traverses the graph to give you perfect answers with inline citations.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 relative overflow-hidden text-center px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-500/10 dark:to-primary-900/20 -z-10"></div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to eliminate compliance hallucinations?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">Join industry leaders using NoesisNet to secure their compliance pipelines with verifiable AI.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white font-bold text-xl hover:shadow-2xl hover:shadow-primary-500/40 transition-all hover:-translate-y-1">
            Get Started Free <ArrowRight size={24} />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo compact={false} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">© 2026 NoesisNet. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-primary-500">Privacy</a>
            <a href="#" className="hover:text-primary-500">Terms</a>
            <a href="#" className="hover:text-primary-500">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
