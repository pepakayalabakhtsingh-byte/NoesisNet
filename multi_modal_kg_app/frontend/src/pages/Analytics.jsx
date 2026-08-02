import React, { useState, useEffect } from 'react';
import { 
  BarChart3, UploadCloud, Database, Activity, Target, ShieldCheck, Link2 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  getEvaluationRuns, getGroundTruthStats, uploadQAGroundTruth, uploadEntityGroundTruth, triggerEvaluation 
} from '../api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Analytics() {
  const [runs, setRuns] = useState([]);
  const [stats, setStats] = useState({ qa_pairs: 0, annotated_documents: 0 });
  const [loading, setLoading] = useState(false);
  const [runningEval, setRunningEval] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [runsData, statsData] = await Promise.all([
        getEvaluationRuns(),
        getGroundTruthStats()
      ]);
      setRuns(runsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch data.", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let intervalId;
    const shouldPoll = runs.some(r => r.status === 'running');
    
    if (shouldPoll) {
      intervalId = setInterval(() => {
        fetchData();
      }, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [runs]);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (type === 'qa') {
        await uploadQAGroundTruth(file);
      } else {
        await uploadEntityGroundTruth(file);
      }
      showToast(`${type.toUpperCase()} ground truth uploaded successfully!`);
      fetchData();
    } catch (err) {
      showToast(`Failed to upload ${type}.`, "error");
    }
    e.target.value = null;
  };

  const handleRunEvaluation = async () => {
    setRunningEval(true);
    try {
      await triggerEvaluation();
      showToast("Evaluation started in background! Check back later.");
      fetchData(); // Fetch immediately to show 'running' status
    } catch (err) {
      showToast("Failed to start evaluation.", "error");
    }
    setRunningEval(false);
  };

  const latestRun = runs.length > 0 && runs[0].status === 'completed' ? runs[0] : (runs[1] || null);
  
  const chartData = [...runs].reverse().filter(r => r.status === 'completed').map((r, i) => ({
    name: `Run ${i+1}`,
    precision: parseFloat((r.retrieval_precision * 100).toFixed(1)),
    f1: parseFloat((r.entity_f1 * 100).toFixed(1)),
    hallucination: parseFloat((r.hallucination_containment_rate * 100).toFixed(1)),
    traceability: parseFloat((r.citation_traceability * 100).toFixed(1))
  }));

  const MetricCard = ({ title, value, icon, desc, color }) => {
    const colorStyles = {
      blue: 'from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
      purple: 'from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
      emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      amber: 'from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    };

    return (
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card p-6 rounded-3xl relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${colorStyles[color]} rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-500`} />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorStyles[color]} border shadow-inner`}>
            {icon}
          </div>
        </div>
        <div className="relative z-10">
          <h3 className="text-slate-500 dark:text-slate-400 font-semibold mb-1">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value !== null ? `${(value * 100).toFixed(1)}` : '--'}
            </span>
            {value !== null && <span className="text-xl font-bold text-slate-400">%</span>}
          </div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-3 leading-snug">{desc}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 p-4 rounded-2xl shadow-2xl border z-50 flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'error' ? 'bg-rose-50/90 dark:bg-rose-900/90 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-100' : 'bg-emerald-50/90 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-100'
            }`}
          >
            {toast.type === 'error' ? <ShieldCheck /> : <Activity />}
            <span className="font-semibold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Evaluation Analytics</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Track AI pipeline performance, RAG metrics, and hallucination containment.</p>
        </div>
        <button 
          onClick={handleRunEvaluation}
          disabled={runningEval}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 group"
        >
          {runningEval ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Activity size={20} className="group-hover:rotate-12 transition-transform" />
          )}
          Run Full Evaluation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Retrieval Precision (@5)" 
          value={latestRun?.retrieval_precision ?? null} 
          icon={<Target size={24} />} 
          desc="Relevance of retrieved chunks & graph entities."
          color="blue"
        />
        <MetricCard 
          title="Entity F1 Score" 
          value={latestRun?.entity_f1 ?? null} 
          icon={<Database size={24} />} 
          desc="Quality of Knowledge Graph extraction vs Truth."
          color="purple"
        />
        <MetricCard 
          title="Hallucination Containment" 
          value={latestRun?.hallucination_containment_rate ?? null} 
          icon={<ShieldCheck size={24} />} 
          desc="Percentage of answers fully supported by sources."
          color="emerald"
        />
        <MetricCard 
          title="Citation Traceability" 
          value={latestRun?.citation_traceability ?? null} 
          icon={<Link2 size={24} />} 
          desc="Accuracy of inline source citations in output."
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="text-primary-500" /> Performance Trends
          </h2>
          {chartData.length > 0 ? (
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                  <Line type="monotone" dataKey="precision" name="Precision" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="f1" name="Entity F1" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="hallucination" name="Hallucination" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="traceability" name="Traceability" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-3 opacity-50" size={32} />
                <p>No completed evaluation runs to display.</p>
              </div>
            </div>
          )}
        </div>

        {/* Ground Truth Management */}
        <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Database className="text-secondary-500" /> Ground Truth Data
          </h2>
          
          <div className="flex-1 space-y-5">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Q&A Pairs</h3>
                <span className="bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-primary-200 dark:border-primary-500/30">
                  {stats.qa_pairs} pairs
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">CSV: question, expected_answer, relevant_document_ids</p>
              <label className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors shadow-sm font-medium">
                <UploadCloud size={18} className="text-primary-500" />
                <span className="text-sm">Upload Q&A CSV</span>
                <input type="file" accept=".csv" className="hidden" onChange={(e) => handleUpload(e, 'qa')} />
              </label>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Entity Annotations</h3>
                <span className="bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-primary-200 dark:border-primary-500/30">
                  {stats.annotated_documents} docs
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">JSON array: doc_id, entities [text, label]</p>
              <label className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors shadow-sm font-medium">
                <UploadCloud size={18} className="text-secondary-500" />
                <span className="text-sm">Upload Entities JSON</span>
                <input type="file" accept=".json" className="hidden" onChange={(e) => handleUpload(e, 'entity')} />
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Run History Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Run History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Precision</th>
                <th className="px-6 py-4">Entity F1</th>
                <th className="px-6 py-4">Hallucination</th>
                <th className="px-6 py-4">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm font-medium">
              {runs.map((run, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-900 dark:text-slate-300">
                    {run.timestamp ? new Date(run.timestamp + (!run.timestamp.endsWith('Z') ? 'Z' : '')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' (IST)' : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      run.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                      run.status === 'running' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 animate-pulse' :
                      'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                    }`}>
                      {run.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{run.status === 'completed' ? `${(run.retrieval_precision * 100).toFixed(1)}%` : '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{run.status === 'completed' ? `${(run.entity_f1 * 100).toFixed(1)}%` : '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{run.status === 'completed' ? `${(run.hallucination_containment_rate * 100).toFixed(1)}%` : '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{run.status === 'completed' ? `${(run.citation_traceability * 100).toFixed(1)}%` : '-'}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Activity className="mx-auto mb-3 opacity-20" size={32} />
                    <p>No evaluation runs found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
