'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Upload,
  BookOpen,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/settings', label: 'API Settings', icon: Settings },
  { href: '/admin/upload', label: 'Upload PDF', icon: Upload },
  { href: '/admin/knowledge', label: 'Knowledge Base', icon: BookOpen },
];

async function logout() {
  await fetch('/api/admin/auth', { method: 'DELETE' });
  window.location.href = '/admin/login';
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex flex-col h-full bg-gray-900 dark:bg-gray-950">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            HR
          </div>
          <div>
            <div className="text-white font-semibold text-sm">HR Admin</div>
            <div className="text-gray-400 text-[10px]">Control Panel</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-gray-700/50 space-y-0.5">
        <Link
          href="/chat"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          <MessageSquare size={16} />
          Open Chatbot
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
