import AdminSidebar from '@/components/admin/AdminSidebar';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'Admin — HR Chatbot',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            HR Chatbot — Admin Panel
          </h2>
          <ThemeToggle />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
