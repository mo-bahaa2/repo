import { useState, useEffect, useRef } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Trash2, Check, X, ExternalLink, Calendar as CalendarIcon, Gavel, Scale } from 'lucide-react';
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

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc
  const [filterService, setFilterService] = useState('all');
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchBookings = async () => {
    try {
      const data = await apiFetch('/api/bookings');
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const handleNewBooking = () => {
      fetchBookings();
    };
    window.addEventListener('new-booking-detected', handleNewBooking);
    return () => window.removeEventListener('new-booking-detected', handleNewBooking);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success('تم تحديث حالة الحجز بنجاح!');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  const executeDeleteBooking = async (id: string) => {
    try {
      await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success('تم حذف الحجز بنجاح!');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteBooking = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-800">هل أنت متأكد من حذف هذا الحجز نهائياً؟</p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => { toast.dismiss(t.id); executeDeleteBooking(id); }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            نعم، احذف
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  let filteredBookings = bookings.filter(b => {
    const matchesTab = activeTab === 'all' || b.status === activeTab;
    const matchesSearch = 
       (b.id && b.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (b.client?.full_name && b.client.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (b.client?.phone && b.client.phone.includes(searchQuery)) ||
       (b.case_type && b.case_type.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesService = filterService === 'all' || b.service?.name === filterService;
    return matchesTab && matchesSearch && matchesService;
  });

  if (sortBy === 'date_desc') {
    filteredBookings.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
  } else if (sortBy === 'date_asc') {
    filteredBookings.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
  }

  const uniqueServices = Array.from(new Set(bookings.map(b => b.service?.name).filter(Boolean)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle className="w-3.5 h-3.5" /> مكتمل</span>;
      case 'confirmed':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><CheckCircle className="w-3.5 h-3.5" /> مؤكد</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3.5 h-3.5" /> بانتظار الدفع</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3.5 h-3.5" /> ملغي</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>الكل</button>
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>بانتظار الدفع</button>
          <button onClick={() => setActiveTab('confirmed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>مؤكد</button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الحجز أو الاسم..." 
              className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2 pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)} 
              className={`border p-2 rounded-xl transition-colors shadow-sm ${isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter className="w-5 h-5" />
            </button>

            {isFilterOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20">
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5"/> الترتيب حسب الموعد</h4>
                  <div className="space-y-1">
                    <button onClick={() => setSortBy('date_desc')} className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'date_desc' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>الأحدث أولاً</button>
                    <button onClick={() => setSortBy('date_asc')} className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'date_asc' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>الأقدم أولاً</button>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1"><Gavel className="w-3.5 h-3.5"/> نوع الاستشارة</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    <button onClick={() => setFilterService('all')} className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterService === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>جميع الخدمات</button>
                    {uniqueServices.map((srv: any) => (
                      <button key={srv} onClick={() => setFilterService(srv)} className={`w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate ${filterService === srv ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {srv}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50/50">
              <tr className="border-b border-slate-200">
                <th className="py-4 px-6 text-sm font-bold text-slate-600">رقم الحجز</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600">بيانات العميل</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600">الخدمة والتخصص</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600">الموعد</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600">الحالة</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-medium">جاري تحميل الحجوزات...</td></tr>
              ) : filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-mono text-sm font-semibold text-slate-900" dir="ltr">{booking.id.substring(0,8)}</td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{booking.client?.full_name || 'عميل محذوف'}</div>
                    <div className="text-sm text-slate-500 font-mono" dir="ltr">{booking.client?.phone || ''}</div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className="font-medium text-slate-800">{booking.service?.name || 'خدمة محذوفة'}</div>
                    {booking.case_type && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                        <Scale className="w-3 h-3 text-amber-600" />
                        {booking.case_type}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className="font-semibold text-slate-900">{formatDate(booking.booking_date)}</div>
                    <div className="text-slate-500 font-medium" dir="ltr">{formatTime(booking.booking_time)}</div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedBooking(booking)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="عرض التفاصيل">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {booking.status === 'pending' && (
                        <button onClick={() => handleUpdateStatus(booking.id, 'confirmed')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تأكيد الحجز">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button onClick={() => handleUpdateStatus(booking.id, 'completed')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="إكمال الحجز">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <button onClick={() => handleUpdateStatus(booking.id, 'cancelled')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="إلغاء الحجز">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteBooking(booking.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف نهائي">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            لا توجد حجوزات تطابق هذا الفلتر.
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                تفاصيل الحجز
              </h3>
              <button onClick={() => setSelectedBooking(null)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedBooking.service?.name}</h2>
                  <p className="text-sm text-slate-500 font-mono mt-1" dir="ltr">#{selectedBooking.id.substring(0,8)}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-100">
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="text-sm text-slate-500 font-bold">تاريخ الموعد</span>
                  <span className="text-sm font-bold text-slate-900">{formatDate(selectedBooking.booking_date)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="text-sm text-slate-500 font-bold">الوقت</span>
                  <span className="text-sm font-bold text-slate-900" dir="ltr">{formatTime(selectedBooking.booking_time)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="text-sm text-slate-500 font-bold">السعر</span>
                  <span className="text-sm font-bold text-indigo-600">{selectedBooking.price_at_booking} ج.م</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="text-sm text-slate-500 font-bold">نوع القضية / التخصص</span>
                  <span className="text-sm font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    {selectedBooking.case_type || 'غير محدد'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="text-sm text-slate-500 font-bold">اسم العميل</span>
                  <span className="text-sm font-bold text-slate-900">{selectedBooking.client?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 font-bold">رقم الهاتف</span>
                  <span className="text-sm font-bold text-slate-900" dir="ltr">{selectedBooking.client?.phone}</span>
                </div>
                {selectedBooking.notes && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="block text-sm text-slate-500 font-bold mb-1">ملاحظات</span>
                    <span className="text-sm text-slate-700 whitespace-pre-line">
                      {selectedBooking.notes.replace(/\[نوع القضية:\s*[^\]]+\]\n?/g, '').trim() || selectedBooking.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
