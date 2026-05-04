'use client';

import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { ChatSession } from '@/types';

interface Props {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export default function ChatSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: Props) {
  return (
    <aside className="flex flex-col h-full w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Chats</span>
        <div className="flex gap-1">
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title="New chat"
          >
            <Plus size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors md:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8 px-4">
            No chat history yet.
            <br />
            Start a new conversation!
          </p>
        ) : (
          [...sessions]
            .sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
            .map((s) => (
              <div
                key={s.id}
                className={clsx(
                  'group flex items-center gap-2 mx-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors',
                  s.id === activeId
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}
                onClick={() => onSelect(s.id)}
              >
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="flex-1 truncate">{s.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-all"
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
        )}
      </div>
    </aside>
  );
}
