'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadResult {
  filename: string;
  chunks: number;
  status: 'success' | 'error';
  message: string;
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith('.pdf')
    );
    if (!pdfFiles.length) return;

    setUploading(true);
    const newResults: UploadResult[] = [];

    for (const file of pdfFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
          newResults.push({
            filename: file.name,
            chunks: data.chunks,
            status: 'success',
            message: data.message,
          });
        } else {
          newResults.push({
            filename: file.name,
            chunks: 0,
            status: 'error',
            message: data.error || 'Upload failed',
          });
        }
      } catch {
        newResults.push({
          filename: file.name,
          chunks: 0,
          status: 'error',
          message: 'Network error',
        });
      }
    }

    setResults((prev) => [...newResults, ...prev]);
    setUploading(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload HR Documents</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload PDF files to add them to the chatbot's knowledge base. Text is extracted,
          chunked, and indexed automatically.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
          dragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3 text-primary-600 dark:text-primary-400">
            <Loader2 size={36} className="animate-spin" />
            <p className="text-sm font-medium">Processing PDF…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <Upload size={36} />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Drag & drop PDF files here, or click to browse
              </p>
              <p className="text-xs mt-1">Supports multiple files · Max 10 MB each</p>
            </div>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="flex gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">Tips for best results</p>
          <ul className="text-xs space-y-0.5 text-blue-600 dark:text-blue-400 list-disc list-inside">
            <li>Use text-based PDFs (not scanned images)</li>
            <li>Akta Kerja 1955, company policy PDFs, HR handbooks all work well</li>
            <li>Uploading the same filename replaces the old version</li>
          </ul>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Upload History</h2>
          {results.map((r, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-start gap-3 rounded-xl px-4 py-3 border text-sm',
                r.status === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              )}
            >
              {r.status === 'success' ? (
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="flex-shrink-0 text-gray-400" />
                  <span className="font-medium text-gray-800 dark:text-gray-100 truncate">
                    {r.filename}
                  </span>
                  {r.status === 'success' && (
                    <span className="ml-auto flex-shrink-0 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {r.chunks} chunks
                    </span>
                  )}
                </div>
                <p
                  className={clsx(
                    'text-xs mt-0.5',
                    r.status === 'success'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {r.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
