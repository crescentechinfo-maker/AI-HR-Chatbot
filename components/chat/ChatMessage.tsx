'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { Message } from '@/types';

interface Props {
  message: Message;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex items-start gap-3 animate-fade-in',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
          isUser
            ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200'
            : 'bg-primary-600 text-white'
        )}
      >
        {isUser ? <User size={14} /> : 'HR'}
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed',
          isUser
            ? 'bg-primary-600 text-white rounded-tr-none'
            : message.isError
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-tl-none'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
        )}
      >
        {message.isError && (
          <div className="flex items-center gap-1.5 mb-1 font-medium text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={12} />
            Error
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Sources: </span>
            {message.sources.join(', ')}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={clsx(
            'text-[10px] mt-1.5',
            isUser ? 'text-primary-200 text-right' : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
