import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, triggerEntityExtraction } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Database, Code, Table as TableIcon, Network, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ForceGraph2D from 'react-force-graph-2d';

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('text');
  const [extracting, setExtracting] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchDoc();
  }, [id]);

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

  if (loading) {
    return (
      <div className="flex justify-center p-24">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center p-12 glass rounded-2xl">
        <h2 className="text-xl font-semibold text-white">Document not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-primary hover:underline">Return to Dashboard</button>
      </div>
    );
  }

  const tabs = [
    { id: 'text', label: 'Text / OCR', icon: <FileText size={16} />, show: !!doc.text },
    { id: 'entities', label: 'Entities & Graph', icon: <Network size={16} />, show: !!doc.entities || !!doc.text },
    { id: 'tables', label: 'PDF Tables', icon: <TableIcon size={16} />, show: !!doc.tables?.length },
    { id: 'rows', label: 'Spreadsheet Rows', icon: <Database size={16} />, show: !!doc.rows?.length },
    { id: 'raw', label: 'Raw JSON', icon: <Code size={16} />, show: true },
  ].filter(t => t.show);

  // Group entities by label
  const groupedEntities = {};
  if (doc.entities) {
    doc.entities.forEach(ent => {
      if (!groupedEntities[ent.label]) groupedEntities[ent.label] = new Set();
      groupedEntities[ent.label].add(ent.text);
    });
  }

  // Graph Data Construction
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
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-primary">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 break-all">{doc.filename}</h1>
          <p className="text-sm text-slate-400 capitalize">Category: {doc.category} &bull; Uploaded: {new Date(doc.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={doc.status} />
          {doc.pages && <span className="text-sm bg-white/5 px-3 py-1 rounded-full text-slate-300">{doc.pages} Pages</span>}
        </div>
      </div>

      {doc.status === 'failed' && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          <strong>Processing Error:</strong> {doc.error}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all border-b-2 font-medium whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-white/5 border-primary text-primary' 
                : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass rounded-b-2xl rounded-tr-2xl overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {activeTab === 'text' && (
              <div className="whitespace-pre-wrap text-slate-300 font-mono text-sm leading-relaxed max-w-full overflow-x-auto">
                {doc.text || <em className="text-slate-500">No text extracted.</em>}
              </div>
            )}

            {activeTab === 'entities' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Knowledge Graph Extraction</h3>
                  <button 
                    onClick={handleManualExtraction}
                    disabled={extracting || !doc.text}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={extracting ? "animate-spin" : ""} />
                    {extracting ? "Extracting..." : "Re-Extract Entities"}
                  </button>
                </div>
                
                {(!doc.entities || doc.entities.length === 0) ? (
                  <div className="text-center p-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <Network size={32} className="mx-auto text-slate-500 mb-3" />
                    <p className="text-slate-400">No entities extracted yet.</p>
                    <p className="text-sm text-slate-500">Click the button above to run the spaCy pipeline.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Entities List */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      <h4 className="font-semibold text-slate-300 border-b border-white/10 pb-2">Named Entities</h4>
                      {Object.entries(groupedEntities).map(([label, entitiesSet]) => (
                        <div key={label} className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3 block">{label}</span>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(entitiesSet).map((ent, i) => (
                              <span key={i} className="px-3 py-1 bg-white/10 text-slate-200 rounded-full text-sm hover:bg-white/20 transition-colors">
                                {ent}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Knowledge Graph */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-300 border-b border-white/10 pb-2">Relationship Graph</h4>
                      {doc.relations?.length > 0 ? (
                        <div 
                          className="bg-black/50 border border-white/10 rounded-xl overflow-hidden relative w-full h-[400px] flex items-center justify-center"
                          ref={containerRef}
                        >
                          {containerRef.current && (
                            <ForceGraph2D
                              width={containerRef.current.offsetWidth}
                              height={400}
                              graphData={graphData}
                              nodeLabel="id"
                              nodeColor={node => node.group === 1 ? "#3b82f6" : "#64748b"}
                              linkColor={() => "#475569"}
                              linkDirectionalArrowLength={3.5}
                              linkDirectionalArrowRelPos={1}
                              linkLabel="name"
                              backgroundColor="#00000000"
                              nodeRelSize={6}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-500 bg-white/5 rounded-xl">
                          No relations found in this text.
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
                  <div key={tIdx} className="overflow-x-auto">
                    <h3 className="text-white font-medium mb-3">Table {tIdx + 1}</h3>
                    <table className="w-full text-left border-collapse text-sm text-slate-300">
                      <tbody>
                        {table.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-white/10 hover:bg-white/5">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 border-r border-white/5 last:border-r-0 break-words whitespace-pre-wrap min-w-[120px]">
                                {cell !== null ? String(cell) : ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rows' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-300">
                  <thead className="bg-white/5 text-slate-200">
                    <tr>
                      {doc.columns?.map(col => (
                        <th key={col} className="p-3 font-semibold border-b border-white/10 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doc.rows?.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-white/10 hover:bg-white/5">
                        {doc.columns?.map(col => (
                          <td key={col} className="p-3 border-r border-white/5 last:border-r-0">
                            {row[col] !== null ? String(row[col]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'raw' && (
              <pre className="text-xs text-slate-400 overflow-auto bg-surface p-4 rounded-lg">
                {JSON.stringify(doc, null, 2)}
              </pre>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
