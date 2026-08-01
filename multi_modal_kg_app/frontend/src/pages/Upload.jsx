import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Upload() {
  const [success, setSuccess] = useState(false);

  const handleSuccess = (result) => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Data</h1>
        <p className="text-slate-400">Add new documents, audio, or schematics to the Knowledge Graph.</p>
      </div>

      <FileUpload onUploadSuccess={handleSuccess} />

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center justify-center gap-2 text-green-200"
          >
            <CheckCircle size={20} />
            <span>Document uploaded successfully! Processing in background.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
