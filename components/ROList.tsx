'use client';

import { useState } from 'react';

export default function ROList() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'request', label: 'Request Form' },
    { id: 'process', label: 'RO Process' },
  ];

  const roData = [
    { id: 'RO-2601-0001', store: 'Zuma Tunjungan', box: 10, status: 'complete' },
    { id: 'RO-2601-0002', store: 'Zuma Tunjungan', box: 10, status: 'delivery' },
    { id: 'RO-2601-0003', store: 'Zuma Tunjungan', box: 10, status: 'dnpb' },
    { id: 'RO-2601-0004', store: 'Zuma Tunjungan', box: 10, status: 'queue' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <span className="status-badge status-complete">complete</span>;
      case 'delivery':
        return <span className="status-badge status-delivery">delivery</span>;
      case 'dnpb':
        return <span className="status-badge status-dnpb">dnpb done</span>;
      case 'queue':
        return <span className="status-badge status-queue">queue</span>;
      default:
        return <span className="status-badge status-queue">{status}</span>;
    }
  };

  return (
    <div className="zuma-card p-4 mb-6">
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <h3 className="font-semibold text-gray-900 mb-4">All Replenishment Orders</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">RO ID</th>
              <th className="pb-3 font-medium">Store</th>
              <th className="pb-3 font-medium text-center">Box</th>
              <th className="pb-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {roData.map((ro) => (
              <tr key={ro.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3 font-mono text-gray-700">{ro.id}</td>
                <td className="py-3 text-gray-900">{ro.store}</td>
                <td className="py-3 text-center text-gray-700">{ro.box}</td>
                <td className="py-3 text-right">{getStatusBadge(ro.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
