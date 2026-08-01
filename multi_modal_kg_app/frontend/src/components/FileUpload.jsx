import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, FileText, Image, Table, X } from 'lucide-react';
import { uploadDocument } from '../api';

export default function FileUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // For simplicity, handle one file at a time, but could be extended
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
      <div 
        {...getRootProps()} 
        className={`glass rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/50 hover:bg-white/5'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary/20 rounded-full text-primary">
            <Upload size={32} />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files to synthesize'}
        </h3>
        <p className="text-slate-400 max-w-sm mx-auto mb-6">
          Supported formats: PDFs, Audio (MP3, WAV), Schematics (PNG, JPG), Tables (CSV, XLSX)
        </p>

        <div className="flex justify-center gap-4 text-slate-500">
          <FileText size={20} />
          <FileAudio size={20} />
          <Image size={20} />
          <Table size={20} />
        </div>
      </div>

      {uploading && (
        <div className="mt-4 p-4 glass rounded-lg flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-slate-300">Uploading and dispatching job...</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between text-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16}/></button>
        </div>
      )}
    </div>
  );
}
