'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Menu, Globe, Settings } from 'lucide-react';
import Link from 'next/link';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';
import TypingIndicator from './TypingIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import type { Message, ChatSession, Language } from '@/types';

const STORAGE_KEY = 'hr-chatbot-sessions';

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function newSession(language: Language): ChatSession {
  return {
    id: uuidv4(),
    title: 'New Chat',
    messages: [],
    language,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load from localStorage once mounted
  useEffect(() => {
    const stored = loadSessions();
    if (stored.length > 0) {
      setSessions(stored);
      setActiveId(stored[0].id);
    } else {
      const s = newSession('en');
      setSessions([s]);
      setActiveId(s.id);
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const updateSession = useCallback(
    (id: string, updater: (s: ChatSession) => ChatSession) => {
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === id ? updater(s) : s));
        saveSessions(next);
        return next;
      });
    },
    []
  );

  const handleNew = () => {
    const s = newSession(language);
    setSessions((prev) => {
      const next = [s, ...prev];
      saveSessions(next);
      return next;
    });
    setActiveId(s.id);
    setSidebarOpen(false);
  };

  const handleDelete = (id: string) => {
    const next = sessions.filter((s: ChatSession) => s.id !== id);
    saveSessions(next);
    setSessions(next);
    if (activeId === id) {
      setActiveId(next[0]?.id ?? null);
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!activeId || isTyping) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Add user message and derive title from first message
    updateSession(activeId, (s) => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 40) : s.title,
      messages: [...s.messages, userMsg],
      updatedAt: new Date().toISOString(),
    }));

    setIsTyping(true);

    try {
      // Build messages array for API (exclude system messages)
      const history = (
        sessions.find((s) => s.id === activeId)?.messages ?? []
      ).filter((m) => m.role !== 'system');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: text }],
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      // Stream the response
      const assistantId = uuidv4();
      let accumulated = '';

      // Append an empty assistant placeholder to stream tokens into
      updateSession(activeId, (s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: assistantId,
            role: 'assistant' as const,
            content: '',
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      }));

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              accumulated += delta;
              updateSession(activeId, (s) => ({
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                ),
              }));
            }
          } catch {
            // skip malformed SSE
          }
        }
      }
    } catch (err) {
      const errMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content:
          err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      updateSession(activeId, (s) => ({
        ...s,
        messages: [...s.messages, errMsg],
        updatedAt: new Date().toISOString(),
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const SUGGESTIONS = language === 'ms'
    ? [
        'Berapa hari cuti tahunan yang saya layak?',
        'Apakah hak pekerja di bawah Akta Kerja 1955?',
        'Bolehkah majikan memecat pekerja tanpa notis?',
        'Apakah kadar gaji lebih masa?',
      ]
    : [
        'How many annual leave days am I entitled to?',
        "What are my rights under the Employment Act 1955?",
        'Can an employer terminate without notice?',
        'What is the overtime pay rate?',
      ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-30 md:z-auto inset-y-0 left-0 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <ChatSidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={(id) => { setActiveId(id); setSidebarOpen(false); }}
          onNew={handleNew}
          onDelete={handleDelete}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 md:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              HR
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                HR Assistant Malaysia
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                Akta Kerja 1955 • Employment Act Expert
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage((l) => (l === 'en' ? 'ms' : 'en'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-600 dark:text-gray-300 transition-colors"
              title="Toggle language"
            >
              <Globe size={13} />
              {language === 'en' ? 'EN' : 'BM'}
            </button>
            <ThemeToggle />
            <Link
              href="/admin"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title="Admin panel"
            >
              <Settings size={16} />
            </Link>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="max-w-xl mx-auto text-center space-y-6 mt-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                HR
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {language === 'ms' ? 'Selamat Datang!' : 'Welcome to HR Assistant'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'ms'
                    ? 'Tanya soalan berkaitan undang-undang buruh Malaysia dan dasar HR.'
                    : 'Ask me anything about Malaysian labor law and HR policies.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300
                               hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700
                               transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeSession.messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </main>

        {/* Input area */}
        <footer className="px-4 pb-4 pt-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto space-y-2">
            <ChatInput
              onSend={handleSend}
              disabled={isTyping}
              placeholder={
                language === 'ms'
                  ? 'Tanya soalan HR anda... (Shift+Enter untuk baris baru)'
                  : 'Ask your HR question… (Shift+Enter for new line)'
              }
            />
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
              {language === 'ms'
                ? 'Jawapan adalah untuk tujuan maklumat sahaja. Bukan nasihat undang-undang.'
                : 'Answers are for informational purposes only and do not constitute legal advice.'}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
