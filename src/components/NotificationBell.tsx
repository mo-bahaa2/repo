import { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, CheckCheck, Clock, Calendar, User, ExternalLink, ShieldCheck, Volume2, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import toast from 'react-hot-toast';

export interface BookingNotification {
  id: string;
  clientName: string;
  clientPhone?: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  createdAt: string;
  isRead: boolean;
}

const POLLING_INTERVAL_SECONDS = 15 * 60; // 15 minutes = 900 seconds

// High-volume, rich dual-harmonic chime sound
const playLoudNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Master volume set HIGH (0.9 out of 1.0)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.9, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Fast punchy attack and smooth resonant decay
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const t = ctx.currentTime;
    
    // Part 1: Bright attention-grabbing chord (G5 + C6)
    playTone(784.0, 'triangle', t, 0.45, 0.95);
    playTone(1046.5, 'sine', t, 0.45, 0.85);

    // Part 2: Louder high-clarity bell chord (E6 + G6 + C7)
    playTone(1318.5, 'triangle', t + 0.16, 0.9, 0.95);
    playTone(1568.0, 'sine', t + 0.16, 0.95, 0.85);
    playTone(2093.0, 'sine', t + 0.18, 1.1, 0.7);

    // Vibration on supported devices (Android / tablet / mobile)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (err) {
    console.error('Audio playback error:', err);
  }
};

const formatNotificationTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'مساءً' : 'صباحاً';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const formatNotificationDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { weekday: 'short', month: 'numeric', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<BookingNotification[]>(() => {
    try {
      const saved = localStorage.getItem('admin_booking_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number>(POLLING_INTERVAL_SECONDS);
  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('admin_booking_notifications', JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  // Automatically request browser desktop notification permission on load & first gesture
  useEffect(() => {
    const checkAndRequestPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            const perm = await Notification.requestPermission();
            setHasPermission(perm === 'granted');
          } catch (e) {
            console.error('Notification permission error:', e);
          }
        } else if (Notification.permission === 'granted') {
          setHasPermission(true);
        }
      }
    };

    // Attempt immediately on mount
    checkAndRequestPermission();

    // Also trigger on first click anywhere (browser user gesture requirement)
    const handleGesture = () => {
      checkAndRequestPermission();
      window.removeEventListener('click', handleGesture);
    };
    window.addEventListener('click', handleGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleGesture);
    };
  }, []);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manual request button
  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setHasPermission(perm === 'granted');
        if (perm === 'granted') {
          toast.success('تم تفعيل إشعارات المتصفح بنجاح!');
          playLoudNotificationChime();
        } else {
          toast.error('تم رفض الإذن من المتصفح، يمكنك تفعيله من إعدادات المتصفح');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Fetch bookings and check for new ones
  const checkForNewBookings = async (isManual = false) => {
    setIsChecking(true);
    try {
      const data: any[] = await apiFetch('/api/bookings');
      if (!Array.isArray(data)) return;

      const knownIdsStr = localStorage.getItem('admin_known_booking_ids');
      let knownIds: string[] = knownIdsStr ? JSON.parse(knownIdsStr) : [];
      const currentIds = data.map(b => b.id);

      // First run: initialize known IDs
      if (!knownIdsStr) {
        localStorage.setItem('admin_known_booking_ids', JSON.stringify(currentIds));
        // Seed recent bookings as initial notifications
        const initialNotifications: BookingNotification[] = data.slice(0, 15).map(b => ({
          id: b.id,
          clientName: b.client?.full_name || 'عميل',
          clientPhone: b.client?.phone || '',
          serviceName: b.service?.name || 'استشارة قانونية',
          bookingDate: b.booking_date,
          bookingTime: b.booking_time,
          status: b.status || 'pending',
          createdAt: b.created_at || new Date().toISOString(),
          isRead: true
        }));
        setNotifications(initialNotifications);
      } else {
        // Find new bookings
        const newBookings = data.filter(b => !knownIds.includes(b.id));

        if (newBookings.length > 0) {
          // Play LOUD chime
          playLoudNotificationChime();

          // Transform to notification items
          const newNotifs: BookingNotification[] = newBookings.map(b => ({
            id: b.id,
            clientName: b.client?.full_name || 'عميل جديد',
            clientPhone: b.client?.phone || '',
            serviceName: b.service?.name || 'استشارة قانونية',
            bookingDate: b.booking_date,
            bookingTime: b.booking_time,
            status: b.status || 'pending',
            createdAt: b.created_at || new Date().toISOString(),
            isRead: false
          }));

          setNotifications(prev => [...newNotifs, ...prev]);

          // Save updated known IDs
          const updatedIds = Array.from(new Set([...knownIds, ...currentIds]));
          localStorage.setItem('admin_known_booking_ids', JSON.stringify(updatedIds));

          // Toast alert with prominent sound
          if (newBookings.length === 1) {
            const b = newBookings[0];
            toast.success(
              `🔔 حجز جديد: ${b.client?.full_name || 'عميل'} (${b.service?.name || 'استشارة'})`,
              { duration: 7000 }
            );
          } else {
            toast.success(`🔔 تم استلام ${newBookings.length} حجوزات جديدة الآن!`, { duration: 7000 });
          }

          // Desktop Notification (with requireInteraction so it stays on screen)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const first = newBookings[0];
            const deskNotif = new Notification('حجز موعد جديد في مكتب المحاماة!', {
              body: `العميل: ${first.client?.full_name || 'عميل'}\nالخدمة: ${first.service?.name || 'استشارة'}\nالموعد: ${first.booking_date} (${first.booking_time})`,
              icon: '/lawyer-demo.png',
              tag: `booking-${first.id}`,
              requireInteraction: true
            });
            deskNotif.onclick = () => {
              window.focus();
              navigate('/admin/bookings');
            };
          }

          // Auto-refresh data on open admin pages
          window.dispatchEvent(new CustomEvent('new-booking-detected', { detail: newBookings }));
        } else if (isManual) {
          toast.success('تم التحقق: لا توجد حجوزات جديدة حالياً');
        }
      }

      setLastChecked(new Date());
      setCountdown(POLLING_INTERVAL_SECONDS);
    } catch (err: any) {
      console.error('Error polling bookings:', err);
      if (isManual) {
        toast.error('تعذر جلب الحجوزات: ' + (err.message || 'خطأ في الاتصال'));
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Main 15-minute polling interval
  useEffect(() => {
    checkForNewBookings();

    const intervalId = setInterval(() => {
      checkForNewBookings();
    }, POLLING_INTERVAL_SECONDS * 1000);

    const countdownTimer = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : POLLING_INTERVAL_SECONDS));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownTimer);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('تم تحديد جميع الإشعارات كمقروءة');
  };

  const handleNotificationClick = (item: BookingNotification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setIsOpen(false);
    navigate('/admin/bookings');
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="الإشعارات"
        className={`relative p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-50 border-indigo-300 text-indigo-600 shadow-sm'
            : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-400 animate-ping opacity-75" />
          </>
        )}
      </button>

      {/* Notifications Dropdown Panel - Anchored to LEFT side so it expands INWARDS and never cuts off */}
      {isOpen && (
        <div
          dir="rtl"
          className="absolute left-0 right-auto mt-3 w-[360px] sm:w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-slate-900 text-base">الإشعارات</span>
              {unreadCount > 0 ? (
                <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  {unreadCount} جديد
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  لا توجد جديدة
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="تحديد الكل كمقروء"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تحديد كمقروء</span>
                </button>
              )}
            </div>
          </div>

          {/* Polling Status Bar */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50/80 to-slate-50 border-b border-indigo-100/60 flex flex-col gap-1.5 text-xs text-indigo-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>فحص تلقائي كل 15 دقيقة (بدون ريفريش)</span>
              </div>
              <button
                onClick={() => checkForNewBookings(true)}
                disabled={isChecking}
                title="فحص فوري للـ API"
                className="text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 font-extrabold bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-2xs hover:bg-indigo-50 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'جاري الفحص...' : 'فحص الآن'}</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>آخر فحص: {lastChecked.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[10px] text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded font-mono font-bold">
                المتبقي: {formatCountdown(countdown)}
              </span>
            </div>
          </div>

          {/* Browser Notification Status / Permission Banner */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            {hasPermission ? (
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>إشعارات المتصفح مفعّلة وجاهزة لتنبيهك</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-amber-800 text-[11px] font-medium">تنبيهات سطح المكتب غير مفعّلة</span>
                <button
                  onClick={requestBrowserPermission}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors shadow-xs"
                >
                  تفعيل الإشعارات
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                <Bell className="w-10 h-10 mb-2 stroke-slate-300" />
                <p className="text-sm font-bold text-slate-700">لا توجد إشعارات حتى الآن</p>
                <p className="text-xs text-slate-400 mt-1">سيتم إشعارك بصوت وتنبيه فوري عند قيام أي عميل بالحجز</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 transition-colors cursor-pointer flex items-start gap-3.5 text-right hover:bg-indigo-50/50 ${
                    !item.isRead ? 'bg-indigo-50/30' : 'bg-white'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                      !item.isRead
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className={`text-sm truncate ${!item.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                        {item.clientName}
                      </p>
                      {!item.isRead ? (
                        <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                          جديد
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] shrink-0 font-medium">
                          مقروء
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-indigo-700 truncate mb-2">
                      {item.serviceName}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatNotificationDate(item.bookingDate)}
                      </span>
                      {item.bookingTime && (
                        <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatNotificationTime(item.bookingTime)}
                        </span>
                      )}
                      {item.clientPhone && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500" dir="ltr">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {item.clientPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <button
              onClick={playLoudNotificationChime}
              title="تجربة صوت النغمة العالي"
              className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 font-bold transition-colors bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
            >
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>تجربة الصوت العالي 🔊</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/bookings');
              }}
              className="text-white bg-indigo-600 hover:bg-indigo-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>عرض كافة الحجوزات</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
