import { CalendarCheck, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import toast from 'react-hot-toast';

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  let [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'مساءً' : 'صباحاً';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${minutes} ${ampm}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return `${days[date.getDay()]}، ${date.toLocaleDateString('en-GB')}`;
};

export default function Dashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await apiFetch('/api/stats');
        setStatsData(stats);
        
        const bookings = await apiFetch('/api/bookings');
        setRecentBookings(bookings.slice(0, 5)); // get only top 5 recent
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleNewBooking = () => {
      fetchData();
    };
    window.addEventListener('new-booking-detected', handleNewBooking);
    return () => window.removeEventListener('new-booking-detected', handleNewBooking);
  }, []);

  const stats = [
    { name: 'إجمالي العملاء', value: statsData?.total_clients || '0', icon: <Users className="w-6 h-6" />, color: 'text-violet-600', bg: 'bg-violet-50' },
    { name: 'الإيرادات', value: `${statsData?.total_revenue || '0'} ج.م`, icon: <DollarSign className="w-6 h-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'حجوزات قادمة', value: statsData?.upcoming_bookings || '0', icon: <CalendarCheck className="w-6 h-6" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'نسبة الإنجاز', value: '92%', icon: <TrendingUp className="w-6 h-6" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];


  return (
    <div className="space-y-8">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">أحدث الحجوزات</h3>
            <button onClick={() => navigate('/admin/bookings')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">عرض الكل</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 text-sm font-semibold text-slate-500">اسم العميل</th>
                  <th className="py-3 text-sm font-semibold text-slate-500">الخدمة</th>
                  <th className="py-3 text-sm font-semibold text-slate-500">الموعد</th>
                  <th className="py-3 text-sm font-semibold text-slate-500">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500">جاري التحميل...</td></tr>
                ) : recentBookings.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500">لا توجد حجوزات حديثة</td></tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-900">{booking.client?.full_name || 'غير معروف'}</td>
                      <td className="py-4 text-slate-600 text-sm">
                        <div className="font-medium text-slate-800">{booking.service?.name || 'تم حذف الخدمة'}</div>
                        {booking.case_type && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {booking.case_type}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-slate-600 text-sm">
                        <div className="font-semibold text-slate-900">{formatDate(booking.booking_date)}</div>
                        <div className="text-slate-500 font-medium" dir="ltr">{formatTime(booking.booking_time)}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {booking.status === 'pending' ? 'بانتظار التأكيد' : booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'completed' ? 'مكتمل' : 'ملغي'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-6">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button onClick={() => navigate('/admin/bookings')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors text-sm">
              + إدارة الحجوزات
            </button>
            <button onClick={() => toast.success('سيتم إضافة بوابات الدفع قريباً!')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors text-sm">
              إرسال رابط دفع
            </button>
            <button onClick={() => navigate('/admin/settings')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors text-sm">
              تعديل مواعيد العمل
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
