import { useState, useEffect } from 'react';
import { Search, MessageSquare, Trash2, CheckCircle, Circle, Phone, FileText, Clock, Mail, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const data = await apiFetch('/api/messages');
      setMessages(data);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      toast.error('فشل تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const toggleRead = async (id: string) => {
    try {
      await apiFetch(`/api/messages/${id}/read`, { method: 'PATCH' });
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, is_read: !m.is_read } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, is_read: !prev.is_read } : null);
      }
    } catch (error) {
      toast.error('فشل تحديث حالة الرسالة');
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await apiFetch(`/api/messages/${id}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      setDeleteConfirmId(null);
      toast.success('تم حذف الرسالة بنجاح');
    } catch (error) {
      toast.error('فشل حذف الرسالة');
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const formatted = cleanPhone.startsWith('0') ? `+2${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  const openMessageDetail = async (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      await toggleRead(msg.id);
    }
  };

  // Filtering
  const filtered = messages.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      filterTab === 'all' ? true : filterTab === 'unread' ? !m.is_read : m.is_read;

    return matchesSearch && matchesTab;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-500" />
            </div>
            الرسائل الواردة
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {unreadCount} جديد
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1 mr-[52px]">
            رسائل الاستفسار المرسلة من صفحة التواصل في الموقع
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{messages.length}</p>
              <p className="text-xs text-slate-500">إجمالي الرسائل</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Circle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
              <p className="text-xs text-slate-500">غير مقروء</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{messages.length - unreadCount}</p>
              <p className="text-xs text-slate-500">مقروء</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {[
              { key: 'all' as const, label: 'الكل' },
              { key: 'unread' as const, label: 'غير مقروء' },
              { key: 'read' as const, label: 'مقروء' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterTab === tab.key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو الهاتف أو الموضوع..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">لا توجد رسائل</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لم تصل أي رسائل حتى الآن'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(msg => (
              <div
                key={msg.id}
                onClick={() => openMessageDetail(msg)}
                className={`flex items-start gap-4 p-5 cursor-pointer transition-all hover:bg-slate-50 ${
                  !msg.is_read ? 'bg-indigo-50/40 border-r-4 border-r-indigo-500' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    !msg.is_read ? 'bg-indigo-500' : 'bg-slate-300'
                  }`}
                >
                  {msg.name.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-sm truncate ${!msg.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                      {msg.name}
                    </h3>
                    <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm mb-1 ${!msg.is_read ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{msg.message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleRead(msg.id)}
                    className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                    title={msg.is_read ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                  >
                    {msg.is_read ? (
                      <Circle className="w-4 h-4 text-slate-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-indigo-500" />
                    )}
                  </button>
                  <button
                    onClick={() => openWhatsApp(msg.phone)}
                    className="p-2 rounded-lg hover:bg-green-100 transition-colors"
                    title="فتح واتساب"
                  >
                    <ExternalLink className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(msg.id)}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedMessage(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setSelectedMessage(null)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {selectedMessage.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedMessage.name}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span dir="ltr">{selectedMessage.phone}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  الموضوع
                </div>
                <p className="text-slate-900 font-bold">{selectedMessage.subject}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  نص الرسالة
                </div>
                <p className="text-slate-700 bg-slate-50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {formatFullDate(selectedMessage.created_at)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={() => openWhatsApp(selectedMessage.phone)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <Phone className="w-4 h-4" />
                الرد عبر واتساب
              </button>
              <button
                onClick={() => toggleRead(selectedMessage.id)}
                className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                {selectedMessage.is_read ? (
                  <>
                    <Circle className="w-4 h-4" />
                    غير مقروء
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    مقروء
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmId(selectedMessage.id);
                }}
                className="w-11 h-11 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">حذف الرسالة</h3>
            <p className="text-sm text-slate-500 mb-6">
              هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => deleteMessage(deleteConfirmId)}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors"
              >
                نعم، حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
