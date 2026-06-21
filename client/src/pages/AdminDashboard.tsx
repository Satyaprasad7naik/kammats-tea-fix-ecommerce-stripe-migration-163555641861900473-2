/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/admin/me`, {credentials: 'include'});
        if (res.ok) {
          setIsAuthenticated(true);
          fetchOrders();
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      setIsAuthenticated(true);
      fetchOrders();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/admin/orders`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok) {
        setOrders(data);
      } else {
        if (res.status === 401) handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        await fetch(`${apiUrl}/api/admin/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {
        console.error(e);
    }
    setIsAuthenticated(false);
    setOrders([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5ebe0] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-black text-[#3e2a21] mb-6 uppercase text-center">Admin Login</h1>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-bold">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d89945]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d89945]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#3e2a21] text-white font-bold rounded-xl hover:bg-[#d89945] transition-colors uppercase tracking-widest text-sm mt-4"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-[#3e2a21] text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div className="font-black text-xl tracking-widest uppercase">Admin Panel</div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-sm font-bold hover:text-[#d89945] transition-colors">View Site</button>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 rounded font-bold text-sm hover:bg-red-700 transition-colors">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Orders</h2>
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-bold text-sm hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <i className="ri-refresh-line"></i> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3e2a21] border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-sm text-gray-600">Order No.</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Date</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Customer</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Status</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Payment</th>
                    <th className="p-4 font-bold text-sm text-gray-600 text-right">Total</th>
                    <th className="p-4 font-bold text-sm text-gray-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">No orders found.</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono text-sm font-medium">{order.orderNumber}</td>
                        <td className="p-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-sm font-bold">{order.customerName}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded uppercase">
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-[#d89945]">₹{order.grandTotal.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          {order.paymentStatus === 'PAID' ? (
                            <a
                              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/invoice`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                            >
                              Invoice
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;