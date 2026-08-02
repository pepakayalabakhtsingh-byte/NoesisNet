import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, triggerEntityExtraction, reprocessDocument } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Database, Code, Table as TableIcon, Network, RefreshCw, Layers, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '../context/ThemeContext';

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('text');
  const [extracting, setExtracting] = useState(false);
  const [containerNode, setContainerNode] = useState(null);
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });

  useEffect(() => {
    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (containerNode) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          if (entry.contentRect.width > 0) {
            setDimensions({ width: entry.contentRect.width, height: 600 });
          }
        }
      });
      resizeObserver.observe(containerNode);
      return () => resizeObserver.disconnect();
    }
  }, [containerNode]);

  const fetchDoc = async () => {
    try {
      const data = await getDocumentById(id);
      setDoc(data);
      if (data.category === 'table' && data.rows?.length) setActiveTab('rows');
      else if (data.entities && data.entities.length > 0) setActiveTab('entities');
      else if (data.tables?.length) setActiveTab('tables');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualExtraction = async () => {
    setExtracting(true);
    try {
      const updatedDoc = await triggerEntityExtraction(id);
      setDoc(updatedDoc);
      setActiveTab('entities');
    } catch (err) {
      alert('Extraction failed: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleReprocess = async () => {
    try {
      await reprocessDocument(id);
      fetchDoc(); // Reload to show pending status
    } catch (err) {
      alert('Reprocess failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full shadow-lg"></div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20 glass-card rounded-3xl max-w-2xl mx-auto mt-10">
        <Layers size={48} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Document not found</h2>
        <p className="text-slate-500 mb-6">The document you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'text', label: 'Text / OCR', icon: <FileText size={18} />, show: !!doc.text },
    { id: 'entities', label: 'Entities & Graph', icon: <Network size={18} />, show: !!doc.entities || !!doc.text },
    { id: 'tables', label: 'PDF Tables', icon: <TableIcon size={18} />, show: !!doc.tables?.length },
    { id: 'rows', label: 'Spreadsheet Rows', icon: <Database size={18} />, show: !!doc.rows?.length },
    { id: 'raw', label: 'Raw JSON', icon: <Code size={18} />, show: true },
  ].filter(t => t.show);

  const groupedEntities = {};
  if (doc.entities) {
    doc.entities.forEach(ent => {
      if (!groupedEntities[ent.label]) groupedEntities[ent.label] = new Set();
      groupedEntities[ent.label].add(ent.text);
    });
  }

  const graphData = { nodes: [], links: [] };
  if (doc.relations) {
    const nodesMap = new Map();
    doc.relations.forEach((rel) => {
      if (!nodesMap.has(rel.subject)) nodesMap.set(rel.subject, { id: rel.subject, group: rel.subject_entity ? 1 : 2, val: 3 });
      if (!nodesMap.has(rel.object)) nodesMap.set(rel.object, { id: rel.object, group: rel.object_entity ? 1 : 2, val: 3 });
      graphData.links.push({
        source: rel.subject,
        target: rel.object,
        name: rel.relation
      });
    });
    graphData.nodes = Array.from(nodesMap.values());
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <button onClick={() => navigate('/dashboard')} className="group flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </button>

      <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-primary-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -z-10"></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 break-all tracking-tight">{doc.filename}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="capitalize px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{doc.category}</span>
            <span>Uploaded: {new Date(doc.created_at + (!doc.created_at.endsWith('Z') ? 'Z' : '')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} (IST)</span>
            {doc.pages && <span>{doc.pages} Pages</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {doc.status === 'failed' && (
        <div className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-400 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-1">Processing Error</strong>
              <span className="text-sm">{doc.error}</span>
            </div>
          </div>
          <button 
            onClick={handleReprocess}
            className="flex items-center gap-2 px-4 py-2 bg-rose-200/50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors whitespace-nowrap"
          >
            <RefreshCw size={16} /> Reprocess Document
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all border-b-2 font-semibold whitespace-nowrap text-sm
              ${activeTab === tab.id 
                ? 'bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-card rounded-b-3xl rounded-tr-3xl overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="p-6 md:p-8"
          >
            {activeTab === 'text' && (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed max-w-full overflow-x-auto bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {doc.text || <em className="text-slate-500">No text extracted.</em>}
                </div>
              </div>
            )}

            {activeTab === 'entities' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Knowledge Graph Extraction</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Entities and relations extracted via spaCy</p>
                  </div>
                  <button 
                    onClick={handleManualExtraction}
                    disabled={extracting || !doc.text}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-semibold rounded-xl hover:bg-primary-200 dark:hover:bg-primary-500/30 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={extracting ? "animate-spin" : ""} />
                    {extracting ? "Extracting..." : "Re-Extract Entities"}
                  </button>
                </div>
                
                {(!doc.entities || doc.entities.length === 0) ? (
                  <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                    <Network size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">No entities extracted yet</p>
                    <p className="text-slate-500">Click the button above to run the AI pipeline on this document.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Entities List */}
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                        <Database size={20} className="text-primary-500" /> Named Entities
                      </h4>
                      {Object.entries(groupedEntities).map(([label, entitiesSet]) => (
                        <div key={label} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4 block flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span> {label}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(entitiesSet).map((ent, i) => (
                              <span key={i} className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-sm border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-default">
                                {ent}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Knowledge Graph */}
                    <div className="space-y-6">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                        <Network size={20} className="text-secondary-500" /> Relationship Graph
                      </h4>
                      {doc.relations?.length > 0 ? (
                        <div 
                          className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden relative w-full h-[600px] flex items-center justify-center shadow-inner"
                          ref={setContainerNode}
                        >
                          {dimensions.width > 0 && (
                            <ForceGraph2D
                              width={dimensions.width}
                              height={600}
                              graphData={graphData}
                              nodeLabel="id"
                              nodeColor={node => node.group === 1 ? (theme === 'dark' ? "#3b82f6" : "#2563eb") : (theme === 'dark' ? "#94a3b8" : "#64748b")}
                              linkColor={() => theme === 'dark' ? "#334155" : "#cbd5e1"}
                              linkDirectionalArrowLength={4}
                              linkDirectionalArrowRelPos={1}
                              linkLabel="name"
                              backgroundColor="transparent"
                              nodeRelSize={6}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <Network size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                          <p className="text-slate-500 font-medium">No relations found in this text.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tables' && (
              <div className="space-y-12">
                {doc.tables?.map((table, tIdx) => (
                  <div key={tIdx} className="overflow-x-auto pb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <TableIcon size={20} className="text-emerald-500" /> Extracted Table {tIdx + 1}
                    </h3>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-sm text-slate-700 dark:text-slate-300">
                        <tbody>
                          {table.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className={`p-4 border-r border-slate-200 dark:border-slate-800 last:border-r-0 break-words whitespace-pre-wrap min-w-[120px] ${rIdx === 0 ? 'bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-900 dark:text-white' : ''}`}>
                                  {cell !== null ? String(cell) : ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rows' && (
              <div className="overflow-x-auto pb-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        {doc.columns?.map(col => (
                          <th key={col} className="p-4 font-bold border-r border-slate-200 dark:border-slate-800 last:border-r-0 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {doc.rows?.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          {doc.columns?.map(col => (
                            <td key={col} className="p-4 border-r border-slate-200 dark:border-slate-800 last:border-r-0 font-medium">
                              {row[col] !== null ? String(row[col]) : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
                <div className="px-4 py-2 bg-[#2D2D2D] border-b border-[#404040] flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Code size={14} /> document.json
                </div>
                <pre className="p-6 text-sm font-mono text-emerald-400 overflow-auto max-h-[600px] custom-scrollbar">
                  {JSON.stringify(doc, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
