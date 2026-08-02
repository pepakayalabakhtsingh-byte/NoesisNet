import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileAudio, Image, Table, Clock, RefreshCw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { reprocessDocument } from '../api';

const getIcon = (category) => {
  switch (category) {
    case 'audio': return <FileAudio size={24} className="text-primary-500" />;
    case 'schematic': return <Image size={24} className="text-secondary-500" />;
    case 'table': return <Table size={24} className="text-emerald-500" />;
    default: return <FileText size={24} className="text-blue-500" />;
  }
};

const getIconBg = (category) => {
  switch (category) {
    case 'audio': return 'bg-primary-500/10';
    case 'schematic': return 'bg-secondary-500/10';
    case 'table': return 'bg-emerald-500/10';
    default: return 'bg-blue-500/10';
  }
};

export default function DocumentCard({ document, onReprocess }) {
  const navigate = useNavigate();

  const handleReprocess = async (e) => {
    e.stopPropagation();
    try {
      await reprocessDocument(document._id);
      if (onReprocess) onReprocess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div 
      onClick={() => navigate(`/dashboard/documents/${document._id}`)}
      className="glass-card p-5 h-full flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${getIconBg(document.category)} group-hover:scale-110 transition-transform`}>
          {getIcon(document.category)}
        </div>
        <StatusBadge status={document.status} />
      </div>
      
      <h4 className="text-slate-900 dark:text-slate-100 font-semibold truncate mb-1" title={document.filename}>
        {document.filename}
      </h4>
      
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4 mt-auto font-medium">
        <Clock size={14} />
        <span>{new Date(document.created_at).toLocaleString()}</span>
      </div>

      {(document.status === 'completed' && document.category === 'audio') && (
        <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-100 dark:border-slate-700/50 shadow-inner">
          "{document.text}"
        </div>
      )}
      
      {document.status === 'failed' && (
        <div className="mt-2">
          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-3 rounded-xl line-clamp-2 mb-2">
            {document.error}
          </div>
          <button 
            onClick={handleReprocess}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-lg text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors"
          >
            <RefreshCw size={14} /> Reprocess
          </button>
        </div>
      )}
    </div>
  );
}
