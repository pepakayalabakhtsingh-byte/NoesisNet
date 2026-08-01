import React, { useEffect, useState } from 'react';
import { getDocuments } from '../api';
import DocumentCard from '../components/DocumentCard';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, FileStack } from 'lucide-react';

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
    // Poll every 5 seconds to update statuses
    const interval = setInterval(fetchDocs, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Total Documents', value: documents.length, icon: <FileStack size={20} className="text-blue-400" /> },
    { label: 'Completed', value: documents.filter(d => d.status === 'completed').length, icon: <CheckCircle size={20} className="text-green-400" /> },
    { label: 'Processing', value: documents.filter(d => d.status === 'processing').length, icon: <Activity size={20} className="text-yellow-400" /> },
    { label: 'Failed', value: documents.filter(d => d.status === 'failed').length, icon: <AlertCircle size={20} className="text-red-400" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Overview of your enterprise compliance knowledge graph.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="glass p-6 rounded-2xl flex items-center gap-4"
          >
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Documents</h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length > 0 ? documents.map((doc, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={doc._id}
              >
                <DocumentCard document={doc} />
              </motion.div>
            )) : (
              <div className="col-span-full p-12 text-center text-slate-500 glass rounded-2xl">
                No documents found. Start by uploading one!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
