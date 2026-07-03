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

  const handleLogout = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        await fetch(`${apiUrl}/api/admin/logout`, { method: 'POST', credentials: 'include' });
        setIsAuthenticated(false);
        setOrders([]);
      } catch(e) {
          console.error(e);
      }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/admin/orders`, {credentials: 'include'});
      if (!res.ok) {
          if (res.status === 401) {
              setIsAuthenticated(false);
              return;
          }
          throw new Error('Failed to fetch orders');
      }
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5ebe0] font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-black text-[#3e2a21] mb-6 text-center uppercase tracking-tighter">Admin Login</h1>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d89945]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#d89945]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#3e2a21] text-white font-bold rounded-xl hover:bg-[#d89945] transition-colors mt-4"
            >
              Login
            </button>
          </form>
          <button onClick={() => navigate('/')} className="w-full text-center mt-4 text-sm text-gray-500 hover:text-black">
              Back to site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-[#3e2a21] text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-black uppercase tracking-widest">Spylt Admin</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/')} className="hover:text-[#d89945] transition-colors text-sm">View Site</button>
          <button onClick={handleLogout} className="hover:text-[#d89945] transition-colors text-sm">Logout</button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Recent Orders</h2>
            <button onClick={fetchOrders} className="text-[#3e2a21] hover:text-[#d89945] flex gap-1 items-center">
                <i className="ri-refresh-line"></i> Refresh
            </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
             <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#3e2a21] border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-semibold">Order No</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Total</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono text-sm">{order.orderNumber}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800 text-sm">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.city}, {order.state}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.businessType === 'B2B' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {order.businessType}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[#d89945]">₹{order.grandTotal.toFixed(2)}</td>
                      <td className="p-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {order.paymentStatus}
                         </span>
                      </td>
                      <td className="p-4">
                         <div className="flex gap-2">
                             <a
                               href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/customer-invoice`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-1"
                               title="Download Customer Invoice"
                             >
                                <i className="ri-file-text-line"></i> Customer
                             </a>
                             <a
                               href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/internal-invoice`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-xs px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors flex items-center gap-1"
                               title="Download Internal Invoice"
                             >
                                <i className="ri-file-list-3-line"></i> Internal
                             </a>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                      <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">No orders found.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
