import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Bookings from './pages/admin/Bookings';
import ServicesManage from './pages/admin/ServicesManage';
import Clients from './pages/admin/Clients';
import Settings from './pages/admin/Settings';
import Messages from './pages/admin/Messages';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="services-manage" element={<ServicesManage />} />
          <Route path="clients" element={<Clients />} />
          <Route path="settings" element={<Settings />} />
          <Route path="messages" element={<Messages />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
