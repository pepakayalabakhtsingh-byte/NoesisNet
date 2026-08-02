import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGraphData, triggerFullBuild } from '../api';
import ForceGraph2D from 'react-force-graph-2d';
import { Database, RefreshCw, Layers, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const COLOR_MAP = {
  'REGULATION': '#ef4444', // red-500
  'ORG': '#3b82f6',        // blue-500
  'DATE': '#10b981',       // emerald-500
  'PERSON': '#8b5cf6',     // violet-500
  'GPE': '#f59e0b',        // amber-500
  'ROLE': '#f97316',       // orange-500
  'DOCTYPE': '#06b6d4',    // cyan-500
  'COMPLIANCE_TERM': '#ec4899' // pink-500
};

const getColorByCategory = (category) => {
  return COLOR_MAP[category] || '#94a3b8'; // slate-400
};

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height)
        });
      }
    });
    resizeObserver.observe(container);
    // Trigger initial measurement
    setDimensions({ width: container.offsetWidth, height: container.offsetHeight });
    return () => resizeObserver.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await fetchGraphData(500);
      
      const nodes = data.nodes.map(n => ({
        id: n.id,
        name: n.name,
        category: n.category,
        val: 2,
        color: getColorByCategory(n.category)
      }));
      
      const links = data.edges.map(e => ({
        source: e.source,
        target: e.target,
        relation: e.relation
      }));
      
      setGraphData({ nodes, links });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuild = async () => {
    setBuilding(true);
    try {
      await triggerFullBuild();
      setTimeout(loadGraph, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[600px] w-full gap-4 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl">
              <Layers size={24} />
            </div>
            Enterprise Knowledge Graph
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Interactive visualization of all extracted entities and relationships.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm">
            <span className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{graphData.nodes.length}</span> Nodes
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-3"></div>
            <span className="text-secondary-600 dark:text-secondary-400 font-bold mr-1.5">{graphData.links.length}</span> Edges
          </div>
          <button 
            onClick={handleBuild}
            disabled={building}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:shadow-none"
          >
            <RefreshCw size={18} className={building ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{building ? "Building Graph..." : "Rebuild Graph"}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 relative">
        {/* Main Graph Area */}
        <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden relative shadow-inner">
          <div className="flex-1 w-full h-full relative" ref={containerRef}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full shadow-lg"></div>
              </div>
            ) : (
              dimensions.width > 0 && dimensions.height > 0 && (
                <ForceGraph2D
                  width={dimensions.width}
                  height={dimensions.height}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeColor="color"
                  nodeRelSize={6}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleSpeed={0.005}
                  linkLabel="relation"
                  backgroundColor="transparent"
                  onNodeClick={(node) => setSelectedNode(node)}
                  linkColor={() => theme === 'dark' ? "#334155" : "#cbd5e1"}
                />
              )
            )}
          </div>
          
          {/* Legend Overlay */}
          {!loading && graphData.nodes.length > 0 && (
            <div className="absolute bottom-6 left-6 max-w-[200px] glass-card p-4 text-xs">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">Entity Types</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {Object.entries(COLOR_MAP).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                    <span className="text-slate-600 dark:text-slate-300 truncate" title={cat}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel for details */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-80 lg:w-96 glass-card rounded-3xl p-6 flex flex-col shrink-0 overflow-y-auto shadow-2xl absolute right-0 inset-y-0 z-20 md:relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white break-words leading-tight">{selectedNode.name}</h2>
                  <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider border" style={{ backgroundColor: selectedNode.color + '15', color: selectedNode.color, borderColor: selectedNode.color + '30' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedNode.color }}></span>
                    {selectedNode.category}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <Database size={16} className="text-primary-500" /> Connected Relationships
                </h3>
                <div className="space-y-3">
                  {graphData.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).map((l, i) => {
                    const isSource = l.source.id === selectedNode.id;
                    const otherNode = isSource ? l.target : l.source;
                    return (
                      <div key={i} className="text-sm bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isSource ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {isSource ? 'Source' : 'Target'}
                          </span>
                          <span className="text-primary-600 dark:text-primary-400 font-medium text-xs">{l.relation}</span>
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white break-words cursor-pointer group-hover:text-primary-500 transition-colors" onClick={() => setSelectedNode(otherNode)}>
                          {otherNode.name || otherNode.id}
                        </div>
                      </div>
                    )
                  })}
                  
                  {graphData.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).length === 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center text-slate-500 border border-slate-200 dark:border-slate-800 border-dashed">
                      No relationships found.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
