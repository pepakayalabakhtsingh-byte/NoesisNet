import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, FileText, Image as ImageIcon, Table, X, Loader2 } from 'lucide-react';
import { uploadDocument } from '../api';
import { motion } from 'framer-motion';

export default function FileUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const file = acceptedFiles[0];
      const result = await uploadDocument(file);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="w-full">
      <motion.div 
        {...getRootProps()} 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`glass-card rounded-3xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group
          ${isDragActive ? 'border-primary-500 bg-primary-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
        `}
      >
        {isDragActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 z-0"></div>
        )}
        
        <input {...getInputProps()} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={`mb-6 p-5 rounded-2xl transition-colors duration-300 ${isDragActive ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30'}`}>
            <Upload size={40} />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {isDragActive ? 'Drop file to upload...' : 'Click or drag & drop to upload'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-base">
            Supported formats: PDFs, Audio (MP3, WAV), Images (PNG, JPG), Tables (CSV, XLSX)
          </p>

          <div className="flex justify-center gap-6 text-slate-400 dark:text-slate-500">
            <div className="flex flex-col items-center gap-2"><FileText size={24} /><span className="text-xs font-medium uppercase tracking-wider">PDF</span></div>
            <div className="flex flex-col items-center gap-2"><FileAudio size={24} /><span className="text-xs font-medium uppercase tracking-wider">Audio</span></div>
            <div className="flex flex-col items-center gap-2"><ImageIcon size={24} /><span className="text-xs font-medium uppercase tracking-wider">Image</span></div>
            <div className="flex flex-col items-center gap-2"><Table size={24} /><span className="text-xs font-medium uppercase tracking-wider">Table</span></div>
          </div>
        </div>
      </motion.div>

      {uploading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 glass-card rounded-2xl flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
          <Loader2 className="animate-spin text-primary-500" size={24} />
          <div className="flex-1">
            <h4 className="text-slate-900 dark:text-white font-semibold">Uploading Document</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Dispatching job to pipeline...</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start justify-between text-rose-700 dark:text-rose-400 shadow-sm"
        >
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
