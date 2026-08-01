import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileAudio, Image, Table, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

const getIcon = (category) => {
  switch (category) {
    case 'audio': return <FileAudio size={24} className="text-purple-400" />;
    case 'schematic': return <Image size={24} className="text-pink-400" />;
    case 'table': return <Table size={24} className="text-green-400" />;
    default: return <FileText size={24} className="text-blue-400" />;
  }
};

export default function DocumentCard({ document }) {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/documents/${document._id}`)}
      className="glass p-5 rounded-xl hover:border-white/20 transition-all duration-200 flex flex-col h-full cursor-pointer hover:bg-white/5 hover:scale-[1.02]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
          {getIcon(document.category)}
        </div>
        <StatusBadge status={document.status} />
      </div>
      
      <h4 className="text-slate-200 font-medium truncate mb-1" title={document.filename}>
        {document.filename}
      </h4>
      
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 mt-auto">
        <Clock size={12} />
        <span>{new Date(document.created_at).toLocaleString()}</span>
      </div>

      {(document.status === 'completed' && document.category === 'audio') && (
        <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap border border-white/5 shadow-inner">
          "{document.text}"
        </div>
      )}
      
      {document.status === 'failed' && (
        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded line-clamp-2">
          {document.error}
        </div>
      )}
    </div>
  );
}
