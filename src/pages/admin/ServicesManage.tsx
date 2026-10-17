import { Plus, Edit2, Clock, CheckCircle2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import toast from 'react-hot-toast';

export default function ServicesManage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<any>(null); // null means adding new

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    is_active: true
  });

  const fetchServices = async () => {
    try {
      const data = await apiFetch('/api/services?active_only=false');
      setServices(data);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setCurrentService(null);
    setFormData({ name: '', description: '', duration_minutes: 30, price: 0, is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (service: any) => {
    setCurrentService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      is_active: service.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentService) {
        await apiFetch(`/api/services/${currentService.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/api/services', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchServices();
      toast.success(currentService ? 'تم تعديل الخدمة بنجاح!' : 'تمت إضافة الخدمة بنجاح!');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const toggleActive = async (service: any) => {
    try {
      await apiFetch(`/api/services/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...service, is_active: !service.is_active })
      });
      fetchServices();
      toast.success('تم تغيير حالة الخدمة بنجاح!');
    } catch (error: any) {
      toast.error('فشل تغيير حالة الخدمة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">إدارة الخدمات المتاحة للحجز</h3>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors duration-300 shadow-sm">
          <Plus className="w-4 h-4" />
          إضافة خدمة جديدة
        </button>
      </div>

      {/* Services List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-10 text-slate-500">جاري تحميل الخدمات...</div>
        ) : services.map((service) => (
          <div key={service.id} className={`bg-white rounded-2xl border ${service.is_active ? 'border-slate-200' : 'border-slate-200 opacity-75'} shadow-sm p-6 flex flex-col relative overflow-hidden group transition-all`}>
            
            {/* Active Status Ribbon */}
            <div className={`absolute top-0 right-0 w-2 h-full ${service.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h4>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {service.duration_minutes} دقيقة</span>
                  {service.description && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="font-medium truncate max-w-[150px]">{service.description}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => openEditModal(service)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="تعديل">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
              <div className="font-bold text-lg text-indigo-600">{service.price} ج.م</div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleActive(service)}
                  className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
                    service.is_active ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {service.is_active ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> مفعلة</>
                  ) : 'متوقفة'}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{currentService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم الخدمة</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الوصف (اختياري)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">السعر (ج.م)</label>
                  <input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المدة (بالدقائق)</label>
                  <input 
                    type="number" 
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: Number(e.target.value)})}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">تفعيل الخدمة فوراً</label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
                  حفظ الخدمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
