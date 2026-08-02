import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
                <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-primary-400 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] bg-secondary-400 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
            </div>
            
            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                <div className="mb-8">
                    <Logo />
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="glass-card p-8 w-full"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-500 dark:text-slate-400">Sign in to your NoesisNet workspace</p>
                    </div>
                    
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                            {error}
                        </motion.div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="email" 
                                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="password" 
                                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={loading}
                            className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 mt-6 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-center mt-8 text-sm">
                        Don't have an account? <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Create workspace</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
