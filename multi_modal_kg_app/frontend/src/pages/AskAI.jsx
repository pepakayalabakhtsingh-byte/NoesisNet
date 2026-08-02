import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, User, Bot, FileText, Database, Code, Sparkles, AlertCircle } from 'lucide-react';
import { askQuestion } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';

export default function AskAI() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am NoesisNet AI. I can answer complex compliance questions by securely reasoning over your enterprise knowledge graph and document vectors. How can I help you today?', sources: [] }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeSources, setActiveSources] = useState([]);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    
    try {
      const data = await askQuestion(userMsg);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer, 
        sources: data.sources,
        graphCount: data.graph_entities_found,
        vectorCount: data.vector_chunks_found
      }]);
      setActiveSources(data.sources || []);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error while analyzing the knowledge graph.', sources: [], isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] min-h-[600px] w-full gap-6 relative">
      
      {/* Chat Area */}
      <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden relative shadow-lg">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">NoesisNet Assistant</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Multi-Modal Graph RAG Intelligence</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar relative bg-slate-50/30 dark:bg-slate-900/20">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10 ${msg.role === 'user' ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-primary-500'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                
                <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : msg.isError ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-tl-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm'}`}>
                  {msg.role === 'user' ? (
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  ) : msg.isError ? (
                    <div className="flex items-center gap-2">
                       <AlertCircle size={18} />
                       <p className="text-[15px] font-medium">{msg.text}</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] leading-relaxed prose-p:my-2 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      
                      {(msg.graphCount > 0 || msg.vectorCount > 0) && (
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-3">
                           {msg.graphCount > 0 && (
                              <div className="flex items-center gap-2 text-xs font-semibold text-secondary-700 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-500/10 border border-secondary-200 dark:border-secondary-500/20 px-3 py-1.5 rounded-lg">
                                <Database size={14} /> Graph: {msg.graphCount} entities
                              </div>
                           )}
                           {msg.vectorCount > 0 && (
                              <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 px-3 py-1.5 rounded-lg">
                                <FileText size={14} /> Vector: {msg.vectorCount} chunks
                              </div>
                           )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-primary-500 flex items-center justify-center shrink-0 shadow-sm z-10">
                  <Bot size={20} />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl rounded-tl-sm px-6 py-5 flex items-center gap-2 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about compliance policies, regulations, entities..."
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-5 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none min-h-[56px] max-h-32 custom-scrollbar shadow-sm"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="h-[56px] w-[56px] flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-2xl disabled:opacity-50 transition-all shadow-md hover:shadow-lg shrink-0 group"
            >
              <Send size={22} className="group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
          <div className="text-center mt-3">
             <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">AI can make mistakes. Always verify critical compliance information via the citations.</p>
          </div>
        </div>
      </div>
      
      {/* Sources Panel */}
      <div className="lg:w-[420px] shrink-0 glass-card rounded-3xl flex flex-col overflow-hidden relative shadow-lg">
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Code size={20} className="text-emerald-500" />
            Cited Sources
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Grounding evidence for the latest response.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
          {activeSources.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
                <FileText className="text-slate-400" size={28} />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No citations yet</p>
              <p className="text-xs text-slate-500">Sources will appear here when the AI answers.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {activeSources.map((source, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.2 }}
                  key={idx} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:border-emerald-500/50 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20 tracking-wider">
                      [{source.tag}]
                    </span>
                    <button 
                      onClick={() => navigate(`/dashboard/documents/${source.doc_id}`)}
                      className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      View Document &rarr;
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-tight" title={source.document_name}>
                    {source.document_name}
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 line-clamp-4 italic">
                      "{source.text}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
      
    </div>
  );
}
