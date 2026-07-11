import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AttendanceWidget from '../components/AttendanceWidget';
import GlobalResetButton from '../components/GlobalResetButton';
import { Menu } from 'lucide-react';
import { setupAdminPushNotifications } from '../../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session } = useAuth();

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
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Top Header — sticky so it stays visible while the page scrolls naturally */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-700"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{session?.name || session?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{session?.role} • {new Date().toLocaleDateString()}</p>
            </div>
            <GlobalResetButton />
            <AttendanceWidget />
          </div>
        </header>

        {/* Page Content — natural document flow so the whole page scrolls
            smoothly on mobile (iOS/Android), instead of relying on a nested
            fixed-height scroll region that can lock up on some mobile
            browsers and installed PWAs. */}
        <main
          className="flex-1 p-4 sm:p-6 w-full overflow-x-hidden"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}