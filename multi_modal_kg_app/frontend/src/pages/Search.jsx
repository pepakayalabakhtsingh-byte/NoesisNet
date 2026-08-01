import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, FileText, FileAudio, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { searchDocuments } from '../api';
import { motion } from 'framer-motion';

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
      case 'pdf': return <FileText size={18} className="text-red-400" />;
      case 'audio': return <FileAudio size={18} className="text-blue-400" />;
      case 'table': return <FileSpreadsheet size={18} className="text-emerald-400" />;
      case 'schematic': return <ImageIcon size={18} className="text-purple-400" />;
      default: return <FileText size={18} className="text-slate-400" />;
    }
  };

  const highlightText = (text) => {
    if (!query) return text;
    
    const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
    if (terms.length === 0) return text;
    
    let highlighted = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-primary/30 text-white rounded px-1">$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="text-center mt-10 mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Semantic Search</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Search across the exact contents of all uploaded PDFs, Audio Transcripts, Tables, and Images using AI vector embeddings.
        </p>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all glass"
            placeholder="E.g., What are the penalties for GDPR non-compliance?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute inset-y-2 right-2 px-6 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      <div className="max-w-3xl mx-auto w-full mt-6 pb-20">
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-10 glass rounded-2xl border border-white/5">
            <p className="text-slate-400">No matching chunks found.</p>
          </div>
        )}

        <div className="space-y-4">
          {results.map((result, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={`${result.doc_id}-${result.chunk_index}`}
              onClick={() => navigate(`/documents/${result.doc_id}`)}
              className="glass p-5 rounded-2xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {getIcon(result.category)}
                  <h3 className="font-semibold text-slate-200 group-hover:text-primary transition-colors">
                    {result.document_name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 bg-white/10 rounded-full text-slate-300">
                    Chunk #{result.chunk_index + 1}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                    {(result.score * 100).toFixed(1)}% Match
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {highlightText(result.text)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
