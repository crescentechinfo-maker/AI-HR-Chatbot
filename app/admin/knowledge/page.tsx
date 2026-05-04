'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Trash2, RefreshCw, FileText, Loader2, AlertTriangle } from 'lucide-react';

interface KnowledgeInfo {
  chunks: number;
  sources: string[];
}

export default function KnowledgePage() {
  const [info, setInfo] = useState<KnowledgeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/knowledge')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteSource = async (source: string) => {
    setDeleting(source);
    try {
      await fetch(`/api/knowledge?source=${encodeURIComponent(source)}`, {
        method: 'DELETE',
      });
      load();
    } finally {
      setDeleting(null);
    }
  };

  const clearAll = async () => {
    setClearingAll(true);
    try {
      await fetch('/api/knowledge', { method: 'DELETE' });
      setConfirmClear(false);
      load();
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Knowledge Base</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage the PDF documents indexed for RAG retrieval.
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={BookOpen}
          label="Total Chunks"
          value={loading ? '…' : String(info?.chunks ?? 0)}
          color="bg-primary-500"
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value={loading ? '…' : String(info?.sources.length ?? 0)}
          color="bg-violet-500"
        />
      </div>

      {/* Document list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Indexed Documents</h2>
          {(info?.sources.length ?? 0) > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-gray-300 dark:text-gray-600" />
          </div>
        ) : !info?.sources.length ? (
          <div className="text-center py-12 space-y-2">
            <BookOpen size={32} className="mx-auto text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No documents uploaded yet.</p>
            <a
              href="/admin/upload"
              className="inline-block mt-1 text-xs text-primary-500 hover:underline"
            >
              Upload a PDF →
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {info.sources.map((src) => (
              <li
                key={src}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <FileText size={16} className="flex-shrink-0 text-gray-400" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {src}
                </span>
                <button
                  onClick={() => deleteSource(src)}
                  disabled={deleting === src}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 text-gray-400 transition-colors disabled:opacity-40"
                  title={`Remove "${src}"`}
                >
                  {deleting === src ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm clear all modal */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={20} />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Clear all documents?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will permanently delete all {info?.chunks} chunks from{' '}
              {info?.sources.length} document(s). The chatbot will fall back to general
              AI knowledge only.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearAll}
                disabled={clearingAll}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                {clearingAll && <Loader2 size={14} className="animate-spin" />}
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white mb-3`}>
        <Icon size={16} />
      </div>
      <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
