import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Settings, Users, FolderOpen, Scale, LogOut, MessageSquare } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'نظرة عامة', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'إدارة الحجوزات', path: '/admin/bookings', icon: <CalendarDays className="w-5 h-5" /> },
    { name: 'العملاء', path: '/admin/clients', icon: <Users className="w-5 h-5" /> },
    { name: 'الخدمات', path: '/admin/services-manage', icon: <FolderOpen className="w-5 h-5" /> },
    { name: 'الإعدادات', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
    { name: 'الرسائل', path: '/admin/messages', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white fixed top-0 bottom-0 right-0 z-40 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Scale className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">عدالة<span className="text-indigo-500">.</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                location.pathname === item.path 
                  ? 'bg-indigo-600 text-white font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200">
            <LogOut className="w-5 h-5" />
            تسجيل الخروج (للموقع)
          </Link>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 lg:pr-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-xl font-bold text-slate-800">
            {navItems.find(item => item.path === location.pathname)?.name || 'لوحة التحكم'}
          </h2>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-indigo-100 overflow-hidden">
              <img src="/bahaa.png" alt="Admin" className="w-full h-full object-cover object-top" />
            </div>
            <div className="hidden sm:block text-sm">
              <div className="font-bold text-slate-900">المستشار بهاء البحيري</div>
              <div className="text-slate-500 text-xs">مدير النظام</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
