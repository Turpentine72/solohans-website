import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';
import { setupAdminPushNotifications } from '../../lib/firebase';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Ask once per admin session. If permission is already granted from a
    // previous visit, the browser won't prompt again.
    setupAdminPushNotifications((payload) => {
      // Foreground message (admin tab is open) — Firebase doesn't auto-show
      // a system notification in this case, so show one manually for a
      // consistent experience whether the tab is open or not.
      const title = payload.notification?.title || 'New notification';
      const body = payload.notification?.body || '';
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.png' });
      }
    });
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-700"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
          {/* Dark mode toggle placeholder / user menu */}
          <div className="flex items-center gap-4">
            {/* Example: Notification icon, user avatar */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}