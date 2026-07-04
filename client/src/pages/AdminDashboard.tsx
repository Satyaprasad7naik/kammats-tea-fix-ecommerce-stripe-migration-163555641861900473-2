/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'analytics'>('dashboard');

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/admin/me`, {credentials: 'include'});
        if (res.ok) {
          setIsAuthenticated(true);
          fetchDashboardData();
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
      fetchDashboardData();
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
        setStats(null);
        setProducts([]);
        setAnalytics(null);
      } catch(e) {
          console.error(e);
      }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const [ordersRes, statsRes, productsRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/orders`, {credentials: 'include'}),
          fetch(`${apiUrl}/api/admin/dashboard-stats`, {credentials: 'include'}),
          fetch(`${apiUrl}/api/admin/products`, {credentials: 'include'})
      ]);

      if (!ordersRes.ok || !statsRes.ok || !productsRes.ok) {
          if (ordersRes.status === 401) {
              setIsAuthenticated(false);
              return;
          }
          throw new Error('Failed to fetch dashboard data');
      }

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const productsData = await productsRes.json();

      setOrders(ordersData);
      setStats(statsData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
      try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/admin/analytics`, {credentials: 'include'});
          if (res.ok) {
              const data = await res.json();
              setAnalytics(data);
          }
      } catch (err) {
          console.error(err);
      }
  }

  const updateOrderStatus = async (id: string, orderStatus: string) => {
      try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/admin/orders/${id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ orderStatus })
          });
          if (res.ok) {
              fetchDashboardData();
          }
      } catch (e) {
          console.error("Failed to update status", e);
      }
  };

  const updateProductStock = async (id: string, stock: number) => {
      try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/admin/products/${id}/stock`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ stock })
          });
          if (res.ok) {
              fetchDashboardData();
          }
      } catch (e) {
          console.error("Failed to update stock", e);
      }
  };

  useEffect(() => {
      if (activeTab === 'analytics' && !analytics) {
          fetchAnalytics();
      }
  }, [activeTab]);

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
      <nav className="bg-[#3e2a21] text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-black uppercase tracking-widest">Spylt Business OS</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/')} className="hover:text-[#d89945] transition-colors text-sm font-bold">View Site</button>
          <button onClick={handleLogout} className="hover:text-[#d89945] transition-colors text-sm font-bold">Logout</button>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex">
              <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-6 py-4 font-bold text-sm ${activeTab === 'dashboard' ? 'border-b-2 border-[#d89945] text-[#d89945]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                  Command Center
              </button>
              <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-4 font-bold text-sm ${activeTab === 'orders' ? 'border-b-2 border-[#d89945] text-[#d89945]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                  Orders
              </button>
              <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-6 py-4 font-bold text-sm ${activeTab === 'inventory' ? 'border-b-2 border-[#d89945] text-[#d89945]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                  Inventory
              </button>
              <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 font-bold text-sm ${activeTab === 'analytics' ? 'border-b-2 border-[#d89945] text-[#d89945]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                  Analytics
              </button>
          </div>
      </div>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">

        {loading ? (
          <div className="flex justify-center p-12">
             <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#3e2a21] border-t-transparent"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Today's Overview</h2>
                       <button onClick={fetchDashboardData} className="text-gray-500 hover:text-[#d89945] transition-colors">
                          <i className="ri-refresh-line text-xl"></i>
                       </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">Today's Revenue</p>
                           <h3 className="text-3xl font-black text-[#d89945]">₹{stats.todaysRevenue.toFixed(2)}</h3>
                       </div>
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">Today's Orders</p>
                           <h3 className="text-3xl font-black text-gray-800">{stats.todaysOrdersCount}</h3>
                       </div>
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">Business Split</p>
                           <div className="flex gap-4 mt-1">
                               <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">B2B: {stats.b2bOrders}</span>
                               <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">B2C: {stats.b2cOrders}</span>
                           </div>
                       </div>
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">Pending Processing</p>
                           <h3 className="text-3xl font-black text-red-500">{stats.pendingOrders}</h3>
                       </div>
                    </div>

                    {stats?.lowStockProducts?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                            <h4 className="text-red-700 font-bold mb-2 flex items-center gap-2">
                                <i className="ri-alert-line"></i> Low Stock Alerts
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {stats.lowStockProducts.map((p: any) => (
                                    <span key={p.id} className="bg-white px-3 py-1 rounded-full text-xs font-bold text-red-600 shadow-sm border border-red-100">
                                        {p.name} (Stock: {p.stock})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Order Management</h2>
                    </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                          <th className="p-4 font-semibold whitespace-nowrap">Order No</th>
                          <th className="p-4 font-semibold whitespace-nowrap">Customer</th>
                          <th className="p-4 font-semibold whitespace-nowrap">Total</th>
                          <th className="p-4 font-semibold whitespace-nowrap">State</th>
                          <th className="p-4 font-semibold whitespace-nowrap text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-mono text-xs whitespace-nowrap">
                                {order.orderNumber}
                                <br/><span className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-gray-800 text-sm whitespace-nowrap">{order.customerName}</p>
                              <span className={`px-2 py-0.5 mt-1 inline-block rounded text-[10px] font-bold uppercase tracking-widest ${order.businessType === 'B2B' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {order.businessType}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-[#d89945] whitespace-nowrap">₹{order.grandTotal.toFixed(2)}</td>
                            <td className="p-4">
                               <select
                                   value={order.orderStatus}
                                   onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                   className="text-[10px] border border-gray-300 rounded p-1 font-bold uppercase tracking-wider bg-white"
                               >
                                   <option value="DRAFT">DRAFT</option>
                                   <option value="SUBMITTED">SUBMITTED</option>
                                   <option value="AWAITING_PAYMENT">AWAITING PAYMENT</option>
                                   <option value="PAYMENT_VERIFIED">PAYMENT VERIFIED</option>
                                   <option value="CONFIRMED">CONFIRMED</option>
                                   <option value="PREPARING">PREPARING</option>
                                   <option value="PACKED">PACKED</option>
                                   <option value="READY">READY</option>
                                   <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                                   <option value="DELIVERED">DELIVERED</option>
                                   <option value="COMPLETED">COMPLETED</option>
                                   <option value="CANCELLED">CANCELLED</option>
                                   <option value="REJECTED">REJECTED</option>
                                   <option value="EXPIRED">EXPIRED</option>
                               </select>
                            </td>
                            <td className="p-4">
                               <div className="flex gap-1 mb-2 justify-end">
                                    {order.communications?.map((comm: any) => (
                                        <span key={comm.id} title={`${comm.type} - ${comm.status}`} className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${comm.status === 'SENT' ? 'bg-green-100 text-green-600' : comm.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            <i className={comm.type === 'EMAIL' ? 'ri-mail-line' : 'ri-whatsapp-line'}></i>
                                        </span>
                                    ))}
                               </div>
                               <div className="flex gap-2 justify-end">
                                   <a
                                     href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/customer-invoice`}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="text-[10px] px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded transition-colors flex items-center gap-1 uppercase tracking-wider"
                                     title="Download Customer Invoice"
                                   >
                                      <i className="ri-user-line"></i>
                                   </a>
                                   <a
                                     href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${order.id}/internal-invoice`}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="text-[10px] px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded transition-colors flex items-center gap-1 uppercase tracking-wider"
                                     title="Download Internal Invoice"
                                   >
                                      <i className="ri-briefcase-4-line"></i>
                                   </a>
                               </div>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-500">No orders found.</td>
                            </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Inventory Management</h2>
                    </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                          <th className="p-4 font-semibold whitespace-nowrap">Product</th>
                          <th className="p-4 font-semibold whitespace-nowrap">Category</th>
                          <th className="p-4 font-semibold whitespace-nowrap">Price</th>
                          <th className="p-4 font-semibold whitespace-nowrap">Stock</th>
                          <th className="p-4 font-semibold whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                                <p className="font-bold text-sm text-gray-800">{product.name}</p>
                                <p className="text-xs text-gray-500 font-mono">{product.slug}</p>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{product.category || 'N/A'}</td>
                            <td className="p-4 text-sm font-bold">₹{product.price.toFixed(2)}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded font-bold text-xs ${product.stock <= 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {product.stock}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateProductStock(product.id, product.stock + 10)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-bold transition-colors"
                                    >
                                        +10 Stock
                                    </button>
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}

            {activeTab === 'analytics' && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-4">Revenue Breakdown</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Daily Average</span>
                                <span className="font-bold">₹{analytics.dailyAvg?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Total GST Collected</span>
                                <span className="font-bold">₹{analytics.totalGST?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Total Revenue (All Time)</span>
                                <span className="font-bold text-[#d89945]">₹{analytics.totalRevenue?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-4">Top Products</h3>
                        <div className="space-y-4">
                            {analytics.topProducts?.map((item: any, idx: number) => (
                                <div key={item.productName} className="flex justify-between items-center border-b pb-2">
                                    <div className="flex gap-3 items-center">
                                        <span className="font-bold text-gray-400">#{idx + 1}</span>
                                        <span className="font-bold text-sm">{item.productName}</span>
                                    </div>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold">{item._sum.quantity} Sold</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
