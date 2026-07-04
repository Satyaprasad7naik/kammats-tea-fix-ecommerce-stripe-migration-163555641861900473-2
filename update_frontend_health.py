import os

filepath = 'client/src/pages/AdminDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

old_health_ui = """            {activeTab === 'health' && health && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h2 className="text-3xl font-bold text-gray-800 tracking-tight">System Health</h2>
                       <button onClick={fetchHealthData} className="text-gray-500 hover:text-blue-500 transition-colors">
                          <i className="ri-refresh-line text-xl"></i>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">Database Connectivity</p>
                           <h3 className={`text-xl font-black ${health.database === 'connected' ? 'text-green-500' : 'text-red-500'} uppercase tracking-widest`}>
                               {health.database}
                           </h3>
                       </div>
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">System Memory</p>
                           <h3 className="text-3xl font-black text-gray-800">{health.memoryUsage}</h3>
                           <p className="text-xs text-gray-400 mt-1">{health.freeMemoryMB} MB Free / {health.totalMemoryMB} MB Total</p>
                       </div>
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">Sheets Sync Lag</p>
                           <h3 className={`text-3xl font-black ${health.metrics.unsyncedSheetsCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                               {health.metrics.unsyncedSheetsCount}
                           </h3>
                           <p className="text-xs text-gray-400 mt-1">Pending Google Syncs</p>
                       </div>
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                           <p className="text-gray-500 text-sm font-bold mb-1">Dead Letters</p>
                           <h3 className={`text-3xl font-black ${health.metrics.deadLetterCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                               {health.metrics.deadLetterCount}
                           </h3>
                           <p className="text-xs text-gray-400 mt-1">Comms permanently failed</p>
                       </div>
                    </div>
                </div>
            )}"""

new_health_ui = """            {activeTab === 'health' && health && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Operations Health</h2>
                       <button onClick={fetchHealthData} className="text-gray-500 hover:text-blue-500 transition-colors">
                          <i className="ri-refresh-line text-xl"></i>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center ${health.metrics.pendingOrdersCount > 10 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                           <p className="text-gray-600 text-sm font-bold mb-1">Pending Orders</p>
                           <h3 className={`text-3xl font-black ${health.metrics.pendingOrdersCount > 10 ? 'text-yellow-700' : 'text-green-700'}`}>
                               {health.metrics.pendingOrdersCount}
                           </h3>
                           <p className="text-xs text-gray-500 mt-1">Awaiting Processing</p>
                       </div>

                       <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center ${health.metrics.unsyncedSheetsCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                           <p className="text-gray-600 text-sm font-bold mb-1">Reporting Sync</p>
                           <h3 className={`text-3xl font-black ${health.metrics.unsyncedSheetsCount > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                               {health.metrics.unsyncedSheetsCount}
                           </h3>
                           <p className="text-xs text-gray-500 mt-1">Unsynced Rows</p>
                       </div>

                       <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center ${health.metrics.failedCommunicationsCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                           <p className="text-gray-600 text-sm font-bold mb-1">Message Retries</p>
                           <h3 className={`text-3xl font-black ${health.metrics.failedCommunicationsCount > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                               {health.metrics.failedCommunicationsCount}
                           </h3>
                           <p className="text-xs text-gray-500 mt-1">Retrying Delivery</p>
                       </div>

                       <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center ${health.metrics.deadLetterCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                           <p className="text-gray-600 text-sm font-bold mb-1">Dead Letters</p>
                           <h3 className={`text-3xl font-black ${health.metrics.deadLetterCount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                               {health.metrics.deadLetterCount}
                           </h3>
                           <p className="text-xs text-gray-500 mt-1">Permanently Failed</p>
                       </div>
                    </div>
                </div>
            )}"""

content = content.replace(old_health_ui, new_health_ui)

with open(filepath, 'w') as f:
    f.write(content)
