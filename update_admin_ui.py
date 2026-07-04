import os

filepath = 'client/src/pages/AdminDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the orderStatus select options
old_select = """                               <select
                                   value={order.orderStatus}
                                   onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                   className="text-xs border border-gray-300 rounded p-1 font-bold"
                               >
                                   <option value="PROCESSING">PROCESSING</option>
                                   <option value="SHIPPED">SHIPPED</option>
                                   <option value="DELIVERED">DELIVERED</option>
                                   <option value="CANCELLED">CANCELLED</option>
                               </select>"""

new_select = """                               <select
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
                               </select>"""

content = content.replace(old_select, new_select)

with open(filepath, 'w') as f:
    f.write(content)
