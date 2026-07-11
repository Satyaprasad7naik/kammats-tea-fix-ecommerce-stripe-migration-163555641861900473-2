import re

with open('client/src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Add states for filter/search
state_vars = """
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
"""

content = content.replace("  const navigate = useNavigate();", "  const navigate = useNavigate();\n" + state_vars)

# Add API action functions
action_functions = """
  const handlePaymentUpdate = async (id: string, status: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchOrders();
    } catch (e) { console.error(e); }
  };

  const handleStatusUpdate = async (id: string, orderStatus: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderStatus })
      });
      if (res.ok) fetchOrders();
    } catch (e) { console.error(e); }
  };

  const handleResendWhatsapp = async (id: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/resend-whatsapp`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) alert('WhatsApp resend initiated');
    } catch (e) { console.error(e); }
  };

  const handleRegenerateInvoice = async (id: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/admin/orders/${id}/regenerate-invoice`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) fetchOrders();
    } catch (e) { console.error(e); }
  };
"""

content = content.replace("  const handleLogout = async () => {", action_functions + "\n  const handleLogout = async () => {")

# Filter logic before mapping
filter_logic = """
  const filteredOrders = orders.filter(o => {
      const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (o.phone && o.phone.includes(searchTerm));
      const matchesStatus = statusFilter ? o.orderStatus === statusFilter : true;
      const matchesPayment = paymentFilter ? o.paymentStatus === paymentFilter : true;
      return matchesSearch && matchesStatus && matchesPayment;
  });
"""

content = content.replace("  if (!isAuthenticated) {", filter_logic + "\n  if (!isAuthenticated) {")

# Replace map to use filteredOrders
content = content.replace("orders.map((order) => (", "filteredOrders.map((order) => (")
content = content.replace("orders.length === 0", "filteredOrders.length === 0")

# Update table headers and add filter UI
filters_ui = """
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
                type="text"
                placeholder="Search by Order No, Name, Phone..."
                className="px-4 py-2 border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select className="px-4 py-2 border rounded" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                <option value="PICKED_UP">PICKED UP</option>
                <option value="CANCELLED">CANCELLED</option>
            </select>
            <select className="px-4 py-2 border rounded" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="">All Payments</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
            </select>
        </div>
"""

content = content.replace('<div className="bg-white rounded-xl shadow overflow-hidden">', filters_ui + '\n<div className="bg-white rounded-xl shadow overflow-hidden">')

# Add columns and action buttons
table_header = """
                  <tr>
                    <th className="p-4 font-bold text-sm text-gray-600">Order No.</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Date</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Customer</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Status</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Payment</th>
                    <th className="p-4 font-bold text-sm text-gray-600 text-right">Total</th>
                    <th className="p-4 font-bold text-sm text-gray-600 text-center">Action</th>
                  </tr>
"""
new_table_header = """
                  <tr>
                    <th className="p-4 font-bold text-sm text-gray-600">Order No.</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Date</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Customer</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Status</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Payment</th>
                    <th className="p-4 font-bold text-sm text-gray-600">Sync</th>
                    <th className="p-4 font-bold text-sm text-gray-600 text-right">Total</th>
                    <th className="p-4 font-bold text-sm text-gray-600 text-center">Action</th>
                  </tr>
"""
content = content.replace(table_header, new_table_header)

row_content = """
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
"""

new_row_content = """
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                             <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                               {order.paymentStatus}
                             </span>
                             {order.paymentStatus !== 'PAID' && (
                               <button onClick={() => handlePaymentUpdate(order.id, 'PAID')} className="text-xs bg-green-500 text-white rounded px-2 py-1 hover:bg-green-600">Mark Paid</button>
                             )}
                          </div>
                        </td>
                        <td className="p-4">
                           <div className="flex flex-col gap-1 text-xs">
                             <div className="flex justify-between w-24"><span>WA:</span> <span className={order.whatsappStatus==='FAILED'?'text-red-500':'text-gray-600'}>{order.whatsappStatus}</span></div>
                             <div className="flex justify-between w-24"><span>Sheet:</span> <span className={order.sheetStatus==='FAILED'?'text-red-500':'text-gray-600'}>{order.sheetStatus}</span></div>
                           </div>
                        </td>
                        <td className="p-4 text-right font-bold text-[#d89945]">₹{order.grandTotal.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            {order.invoiceUrl ? (
                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${order.invoiceUrl}`} target="_blank" className="text-blue-600 text-xs font-bold hover:underline">View PDF (v{order.invoiceVersion})</a>
                            ) : (
                                <span className="text-gray-400 text-xs">Generating...</span>
                            )}
                            <select className="text-xs border rounded p-1" value={order.orderStatus} onChange={(e) => handleStatusUpdate(order.id, e.target.value)}>
                                <option value="PROCESSING">Processing</option>
                                <option value="READY_FOR_PICKUP">Ready</option>
                                <option value="PICKED_UP">Picked Up</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <button onClick={() => handleResendWhatsapp(order.id)} className="text-xs text-blue-600 hover:underline">Resend WA</button>
                            <button onClick={() => handleRegenerateInvoice(order.id)} className="text-xs text-gray-500 hover:underline">Regenerate</button>
                          </div>
                        </td>
"""

content = content.replace(row_content, new_row_content)

with open('client/src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)
