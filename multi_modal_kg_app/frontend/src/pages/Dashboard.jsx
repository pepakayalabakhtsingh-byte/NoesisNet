import React, { useEffect, useState } from 'react';
import { getDocuments } from '../api';
import DocumentCard from '../components/DocumentCard';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, FileStack, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Total Documents', value: documents.length, icon: <FileStack size={24} className="text-primary-500" />, bg: 'bg-primary-500/10' },
    { label: 'Processed', value: documents.filter(d => d.status === 'completed').length, icon: <CheckCircle size={24} className="text-emerald-500" />, bg: 'bg-emerald-500/10' },
    { label: 'Processing', value: documents.filter(d => d.status === 'processing' || d.status === 'pending').length, icon: <Activity size={24} className="text-amber-500" />, bg: 'bg-amber-500/10' },
    { label: 'Failed', value: documents.filter(d => d.status === 'failed').length, icon: <AlertCircle size={24} className="text-rose-500" />, bg: 'bg-rose-500/10' },
  ];

  const [filter, setFilter] = useState('all');
  const filteredDocuments = documents.filter(doc => filter === 'all' || doc.category === filter);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome back</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Here's what's happening in your compliance graph today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/upload" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-500 text-white font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all hover:-translate-y-0.5">
            <Plus size={18} /> Upload Document
          </Link>
          <Link to="/dashboard/ask" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5">
            Ask AI <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, ease: 'easeOut' }}
            key={stat.label} 
            className="glass-card p-6 flex flex-col group hover:-translate-y-1 transition-transform duration-300"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight"
              >
                {stat.value}
              </motion.div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recent Documents</h2>
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {['all', 'audio', 'pdf', 'schematic', 'table'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === cat ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.length > 0 ? filteredDocuments.map((doc, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: 'easeOut' }}
                key={doc._id}
              >
                <DocumentCard document={doc} onReprocess={fetchDocs} />
              </motion.div>
            )) : (
              <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 glass-card">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileStack size={32} className="text-slate-400" />
                </div>
                <p className="text-lg font-medium mb-1">No documents found</p>
                <p className="text-sm">Start by uploading a document to see it here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
