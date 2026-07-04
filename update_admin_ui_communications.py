import os

filepath = 'client/src/pages/AdminDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_actions_td = """                            <td className="p-4">
                               <div className="flex gap-2 justify-end">"""

new_actions_td = """                            <td className="p-4">
                               <div className="flex gap-1 mb-2 justify-end">
                                    {order.communications?.map((comm: any) => (
                                        <span key={comm.id} title={`${comm.type} - ${comm.status}`} className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${comm.status === 'SENT' ? 'bg-green-100 text-green-600' : comm.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            <i className={comm.type === 'EMAIL' ? 'ri-mail-line' : 'ri-whatsapp-line'}></i>
                                        </span>
                                    ))}
                               </div>
                               <div className="flex gap-2 justify-end">"""

content = content.replace(old_actions_td, new_actions_td)

with open(filepath, 'w') as f:
    f.write(content)
