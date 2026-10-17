import { Search, Filter, Mail, Phone, ExternalLink, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import toast from 'react-hot-toast';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const fetchClients = async () => {
    try {
      const data = await apiFetch('/api/clients');
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const executeDeleteClient = async (id: string) => {
    try {
      await apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
      setClients(prev => prev.filter(c => c.id !== id));
      toast.success('تم حذف العميل بنجاح!');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteClient = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-800">هل أنت متأكد من حذف هذا العميل نهائياً؟</p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => { toast.dismiss(t.id); executeDeleteClient(id); }}
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

  const filteredClients = clients.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-slate-900">سجل العملاء</h3>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو رقم الهاتف..." 
              className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl py-2 pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
            />
          </div>
          <button className="bg-white border border-slate-200 p-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50/50">
              <tr className="border-b border-slate-200">
                <th className="py-4 px-6 text-sm font-bold text-slate-600">العميل</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600">معلومات الاتصال</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600 text-center">عدد الحجوزات</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600 text-center">إجمالي المدفوعات</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600">آخر نشاط</th>
                <th className="py-4 px-6 text-sm font-bold text-slate-600 text-center">الملف</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-medium">جاري تحميل العملاء...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-medium">لا يوجد عملاء يطابقون البحث</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{client.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">{client.id.substring(0,8)}...</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span dir="ltr">{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {client.email || 'لا يوجد'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                        {/* We don't have bookings count from backend directly on client model yet, placeholder */}
                        -
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-emerald-600">
                      -
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {new Date(client.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedClient(client)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                        عرض
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClient(client.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="حذف العميل">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                تفاصيل العميل
              </h3>
              <button onClick={() => setSelectedClient(null)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {selectedClient.full_name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedClient.full_name}</h2>
                <p className="text-sm text-slate-500 font-mono mt-1" dir="ltr">ID: {selectedClient.id}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-0.5">رقم الهاتف</p>
                    <p className="text-slate-900 font-bold text-sm" dir="ltr">{selectedClient.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-500 shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-0.5">البريد الإلكتروني</p>
                    <p className="text-slate-900 font-bold text-sm">{selectedClient.email || 'غير متوفر'}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">تاريخ التسجيل: {new Date(selectedClient.created_at).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
