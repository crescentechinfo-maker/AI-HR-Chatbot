'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Settings, Upload, MessageSquare, FileText, CheckCircle, XCircle } from 'lucide-react';

interface Stats {
  chunks: number;
  sources: string[];
}

interface SettingsMeta {
  apiKey: string;
  model: string;
  useKnowledgeBase: boolean;
  useGeneralKnowledge: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<SettingsMeta | null>(null);

  useEffect(() => {
    fetch('/api/knowledge').then((r) => r.json()).then(setStats).catch(() => {});
    fetch('/api/admin/settings').then((r) => r.json()).then(setMeta).catch(() => {});
  }, []);

  const cards = [
    {
      label: 'Knowledge Chunks',
      value: stats?.chunks ?? '—',
      icon: BookOpen,
      color: 'bg-blue-500',
      href: '/admin/knowledge',
    },
    {
      label: 'Uploaded Documents',
      value: stats?.sources.length ?? '—',
      icon: FileText,
      color: 'bg-emerald-500',
      href: '/admin/upload',
    },
    {
      label: 'Active Model',
      value: meta?.model ? meta.model.split('/')[1] ?? meta.model : '—',
      icon: Settings,
      color: 'bg-violet-500',
      href: '/admin/settings',
    },
    {
      label: 'API Key',
      value: meta?.apiKey && meta.apiKey !== '' ? 'Configured' : 'Missing',
      icon: meta?.apiKey ? CheckCircle : XCircle,
      color: meta?.apiKey ? 'bg-primary-500' : 'bg-red-500',
      href: '/admin/settings',
    },
  ];

  const quickLinks = [
    { href: '/admin/settings', label: 'API Settings', icon: Settings, desc: 'Set your OpenRouter key and model' },
    { href: '/admin/upload', label: 'Upload PDF', icon: Upload, desc: 'Add HR documents to the knowledge base' },
    { href: '/admin/knowledge', label: 'Knowledge Base', icon: BookOpen, desc: 'View and manage document chunks' },
    { href: '/chat', label: 'Open Chatbot', icon: MessageSquare, desc: 'Test the HR assistant' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your HR chatbot configuration and knowledge base.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white mb-3`}>
              <c.icon size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
              {String(c.value)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Toggle status */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Knowledge Toggles</h2>
        <div className="flex flex-wrap gap-3">
          <StatusBadge
            label="PDF Knowledge Base"
            active={meta?.useKnowledgeBase ?? false}
          />
          <StatusBadge
            label="General AI Knowledge"
            active={meta?.useGeneralKnowledge ?? false}
          />
        </div>
        <p className="text-xs text-gray-400">
          Change these in{' '}
          <Link href="/admin/settings" className="text-primary-500 hover:underline">
            API Settings
          </Link>
          .
        </p>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-xl px-5 py-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                <l.icon size={17} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{l.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{l.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
        active
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {label}: {active ? 'ON' : 'OFF'}
    </div>
  );
}
