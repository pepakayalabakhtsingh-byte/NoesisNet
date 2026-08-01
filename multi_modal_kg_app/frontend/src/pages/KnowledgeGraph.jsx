import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGraphData, triggerFullBuild } from '../api';
import ForceGraph2D from 'react-force-graph-2d';
import { Database, RefreshCw, Layers, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_MAP = {
  'REGULATION': '#e74c3c',
  'ORG': '#3498db',
  'DATE': '#2ecc71',
  'PERSON': '#9b59b6',
  'GPE': '#f1c40f',
  'ROLE': '#e67e22',
  'DOCTYPE': '#1abc9c',
  'COMPLIANCE_TERM': '#e84393'
};

const getColorByCategory = (category) => {
  return COLOR_MAP[category] || '#95a5a6';
};

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
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
    <div className="flex h-[calc(100vh-4rem)] min-h-[800px] w-full gap-4 relative">
      {/* Main Graph Area */}
      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden relative border border-white/10">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 z-10">
          <div className="flex items-center gap-3">
            <Layers className="text-primary" />
            <h1 className="text-xl font-bold text-white">Global Knowledge Graph</h1>
            <span className="text-sm text-slate-400 bg-white/5 px-3 py-1 rounded-full">
              {graphData.nodes.length} Nodes &bull; {graphData.links.length} Edges
            </span>
          </div>
          
          <button 
            onClick={handleBuild}
            disabled={building}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={building ? "animate-spin" : ""} />
            {building ? "Building Graph..." : "Build Full Graph"}
          </button>
        </div>

        <div className="flex-1 w-full h-full relative" ref={containerRef}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
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
                backgroundColor="#00000000"
                onNodeClick={(node) => setSelectedNode(node)}
                linkColor={() => "#475569"}
              />
            )
          )}
        </div>
      </div>

      {/* Side Panel for details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-80 glass rounded-2xl border border-white/10 p-6 flex flex-col shrink-0 overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white break-words">{selectedNode.name}</h2>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider" style={{ backgroundColor: selectedNode.color + '40', color: selectedNode.color }}>
                  {selectedNode.category}
                </span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">Connected Relationships</h3>
              <div className="space-y-2">
                {graphData.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).map((l, i) => (
                  <div key={i} className="text-xs bg-white/5 p-2 rounded border border-white/5">
                    <span className="text-slate-400">{l.source.name || l.source.id}</span>
                    <span className="mx-2 text-primary">{l.relation}</span>
                    <span className="text-slate-400">{l.target.name || l.target.id}</span>
                  </div>
                ))}
                
                {graphData.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).length === 0 && (
                  <p className="text-xs text-slate-500">No relationships found.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
