import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Upload() {
  const [success, setSuccess] = useState(false);

  const handleSuccess = (result) => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Upload Data</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Add new documents, audio, or schematics to synthesize into the Knowledge Graph.</p>
      </div>

      <FileUpload onUploadSuccess={handleSuccess} />

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10"
          >
            <CheckCircle size={24} />
            <span className="font-medium">Document uploaded successfully! Processing in background.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
