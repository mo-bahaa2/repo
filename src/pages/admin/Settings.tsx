import { Save, User, Bell, CreditCard, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    lawyer_name: '',
    notification_email: '',
    whatsapp_number: '',
    notify_new_booking: true,
    working_hours: { start: '10:00', end: '18:00', days: [1, 2, 3, 4, 5, 6] }
  });

  const weekDays = [
    { id: 6, name: 'السبت' },
    { id: 7, name: 'الأحد' },
    { id: 1, name: 'الإثنين' },
    { id: 2, name: 'الثلاثاء' },
    { id: 3, name: 'الأربعاء' },
    { id: 4, name: 'الخميس' },
    { id: 5, name: 'الجمعة' }
  ];

  useEffect(() => {
    apiFetch('/api/settings')
      .then(data => {
        setSettings({
          ...settings,
          ...data
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting (API expects key and value)
      for (const [key, value] of Object.entries(settings)) {
        await apiFetch(`/api/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value })
        });
      }
      toast.success('تم حفظ الإعدادات بنجاح!');
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل الإعدادات...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">إعدادات النظام</h3>
        <p className="text-slate-500 text-sm">إدارة معلومات المكتب، تفضيلات الإشعارات، وبوابات الدفع.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Basic Info Section */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">المعلومات الأساسية</h4>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">اسم المحامي / المكتب</label>
              <input type="text" value={settings.lawyer_name} onChange={e => setSettings({...settings, lawyer_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني للإشعارات</label>
              <input type="email" value={settings.notification_email} onChange={e => setSettings({...settings, notification_email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left" dir="ltr" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">رقم هاتف الواتساب (للاستقبال)</label>
              <input type="tel" value={settings.whatsapp_number} onChange={e => setSettings({...settings, whatsapp_number: e.target.value})} className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Working Hours Settings */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">مواعيد العمل (متاح للحجز)</h4>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">من الساعة</label>
              <input type="time" value={settings.working_hours?.start || ''} onChange={e => setSettings({...settings, working_hours: {...settings.working_hours, start: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">إلى الساعة</label>
              <input type="time" value={settings.working_hours?.end || ''} onChange={e => setSettings({...settings, working_hours: {...settings.working_hours, end: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left" dir="ltr" />
            </div>
            
            <div className="sm:col-span-2 mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3">أيام العمل المتاحة</label>
              <div className="flex flex-wrap gap-3">
                {weekDays.map(day => {
                  const isChecked = settings.working_hours?.days?.includes(day.id) || false;
                  return (
                    <button
                      key={day.id}
                      onClick={() => {
                        const currentDays = settings.working_hours?.days || [];
                        const newDays = isChecked 
                          ? currentDays.filter(d => d !== day.id) 
                          : [...currentDays, day.id];
                        setSettings({
                          ...settings,
                          working_hours: { ...settings.working_hours, days: newDays }
                        });
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${isChecked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                    >
                      {day.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">بوابة الدفع (Paymob)</h4>
          </div>
          
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
              <div className="relative">
                <input type="password" defaultValue="************************" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left font-mono" dir="ltr" />
                <button className="absolute left-3 top-2.5 text-xs font-bold text-indigo-600">إظهار</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Integration ID</label>
              <input type="text" defaultValue="1234567" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left font-mono" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Notifications & Security */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">الإشعارات والأمان</h4>
          </div>
          
          <div className="space-y-4 max-w-2xl">
            <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSettings({...settings, notify_new_booking: !settings.notify_new_booking})}>
              <div>
                <div className="font-bold text-slate-900 text-sm">إشعارات الحجز الجديد</div>
                <div className="text-xs text-slate-500 mt-1">إرسال بريد إلكتروني عند قيام عميل بحجز جديد.</div>
              </div>
              <div className={`relative inline-block w-12 h-6 rounded-full transition-colors ${settings.notify_new_booking ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notify_new_booking ? 'left-1' : 'right-1'}`}></span>
              </div>
            </label>
            
            <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <div>
                <div className="font-bold text-slate-900 text-sm">المصادقة الثنائية (2FA)</div>
                <div className="text-xs text-slate-500 mt-1">طلب رمز تأكيد عند تسجيل الدخول للوحة التحكم.</div>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
              </div>
            </label>
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button disabled={saving} onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-70">
          <Save className="w-5 h-5" />
          {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>

    </div>
  );
}
