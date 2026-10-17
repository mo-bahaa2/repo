import { useState } from 'react';
import { Scale, Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      setError('');
      try {
        // Create basic auth token
        const token = btoa(`${email}:${password}`);
        
        // Verify credentials by hitting an admin-protected endpoint
        await fetch('https://backend-test-six-alpha.vercel.app/api/stats', {
          headers: {
            'Authorization': `Basic ${token}`
          }
        }).then(res => {
          if (!res.ok) throw new Error('بيانات الدخول غير صحيحة');
          return res.json();
        });

        // If successful, save token and redirect
        localStorage.setItem('adminToken', token);
        navigate('/admin/dashboard');
      } catch (err: any) {
        setError(err.message || 'فشل تسجيل الدخول');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4" dir="rtl">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] -z-10" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] -z-10" />

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">عدالة<span className="text-indigo-600">.</span></h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">تسجيل الدخول للوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="اسم المستخدم"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-left" 
                dir="ltr"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-left" 
                dir="ltr"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold transition-colors duration-300 group mt-4 disabled:opacity-70"
          >
            {isLoading ? 'جاري التحقق...' : 'دخول'}
            {!isLoading && <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />}
          </button>
        </form>
      </div>
    </div>
  );
}
