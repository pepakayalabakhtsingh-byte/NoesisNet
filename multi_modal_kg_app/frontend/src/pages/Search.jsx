import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, FileText, FileAudio, FileSpreadsheet, Image as ImageIcon, Loader2 } from 'lucide-react';
import { searchDocuments } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchDocuments(query, 10);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (category) => {
    switch (category) {
      case 'pdf': return <FileText size={18} className="text-rose-500" />;
      case 'audio': return <FileAudio size={18} className="text-primary-500" />;
      case 'table': return <FileSpreadsheet size={18} className="text-emerald-500" />;
      case 'schematic': return <ImageIcon size={18} className="text-secondary-500" />;
      default: return <FileText size={18} className="text-slate-400" />;
    }
  };

  const getIconBg = (category) => {
    switch (category) {
      case 'pdf': return 'bg-rose-500/10';
      case 'audio': return 'bg-primary-500/10';
      case 'table': return 'bg-emerald-500/10';
      case 'schematic': return 'bg-secondary-500/10';
      default: return 'bg-slate-500/10';
    }
  };

  const highlightText = (text) => {
    if (!query) return text;
    
    const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
    if (terms.length === 0) return text;
    
    let highlighted = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-primary-500/20 text-primary-700 dark:text-primary-300 rounded px-1 py-0.5">$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="flex flex-col h-full gap-8 relative">
      {/* Decorative blurred blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 dark:opacity-20 animate-blob pointer-events-none -z-10"></div>
      
      <div className="text-center mt-12 mb-6 relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Semantic Search</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Instantly search across PDFs, Audio Transcripts, Tables, and Images using advanced vector embeddings.
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <SearchIcon className="h-7 w-7 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-16 pr-32 py-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-800/50 rounded-2xl text-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 shadow-xl transition-all"
            placeholder="E.g., What are the penalties for GDPR non-compliance?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute inset-y-2 right-2">
            <button
              type="submit"
              disabled={loading}
              className="h-full px-8 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Search'}
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-4xl mx-auto w-full mt-4 pb-20 relative z-10">
        <AnimatePresence mode="wait">
          {searched && !loading && results.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-16 glass-card rounded-3xl"
            >
              <SearchIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No matching chunks found</h3>
              <p className="text-slate-500">Try rephrasing your search query or uploading more relevant documents.</p>
            </motion.div>
          )}

          {results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {results.map((result, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, ease: 'easeOut' }}
                  key={`${result.doc_id}-${result.chunk_index}`}
                  onClick={() => navigate(`/dashboard/documents/${result.doc_id}`)}
                  className="glass-card p-6 md:p-8 rounded-3xl cursor-pointer group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${getIconBg(result.category)} group-hover:scale-110 transition-transform`}>
                        {getIcon(result.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                          {result.document_name}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 capitalize">{result.category} document</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                        Chunk #{result.chunk_index + 1}
                      </span>
                      <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {(result.score * 100).toFixed(1)}% Match
                      </span>
                    </div>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4 m-0">
                      {highlightText(result.text)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
