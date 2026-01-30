'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, GitBranch, ShoppingCart, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import RequestForm from './RequestForm';
import ROProcess from './ROProcess';

interface DashboardStats {
  totalRO: number;
  queued: number;
  totalBoxes: number;
  totalPairs: number;
}

interface ROItem {
  id: string;
  store: string;
  box: number;
  status: string;
}

type SubTab = 'dashboard' | 'request' | 'process';

export default function ROPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');

  const subTabs = [
    { id: 'dashboard' as SubTab, label: 'Dashboard' },
    { id: 'request' as SubTab, label: 'Request Form' },
    { id: 'process' as SubTab, label: 'RO Process' },
  ];

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'request':
        return <RequestForm />;
      case 'process':
        return <ROProcess />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full">
      {/* Top Sub-Tabs - Simple text style with separators */}
      <div className="bg-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-center">
          {subTabs.map((tab, index) => {
            const isActive = activeSubTab === tab.id;
            
            return (
              <div key={tab.id} className="flex items-center">
                <button
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors duration-200",
                    isActive 
                      ? "text-gray-900" 
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab.label}
                </button>
                {index < subTabs.length - 1 && (
                  <div className="w-px h-4 bg-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab Content */}
      <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {renderSubContent()}
      </div>
    </div>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({ totalRO: 0, queued: 0, totalBoxes: 0, totalPairs: 0 });
  const [roData, setRoData] = useState<ROItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ro/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data.stats ?? { totalRO: 0, queued: 0, totalBoxes: 0, totalPairs: 0 });
        setRoData(json.data.roList ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statsCards = [
    { value: stats.totalRO.toString(), label: 'Total RO', bgColor: 'bg-[#0D3B2E]', icon: ShoppingCart },
    { value: stats.queued.toString(), label: 'Queued', bgColor: 'bg-[#0D3B2E]', icon: ShoppingCart },
    { value: stats.totalBoxes.toString(), label: 'Box', bgColor: 'bg-[#00D084]', icon: ShoppingCart },
    { value: stats.totalPairs.toString(), label: 'Pairs', bgColor: 'bg-[#00D084]', icon: ShoppingCart },
  ];

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">complete</span>;
      case 'in_delivery':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">delivery</span>;
      case 'ready_to_ship':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">ready</span>;
      case 'picking':
      case 'pick_verified':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">picking</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">approved</span>;
      case 'queue':
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">queue</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-4 flex items-center justify-between`}
            >
              <div>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? '-' : stat.value}
                </p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <h3 className="font-semibold text-gray-900 p-4 border-b border-gray-100">
          All Replenishment Orders
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="py-3 px-4 font-medium">RO ID</th>
                <th className="py-3 px-4 font-medium">Store</th>
                <th className="py-3 px-4 font-medium text-center">Box</th>
                <th className="py-3 px-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : roData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">No RO data yet</td>
                </tr>
              ) : (
                roData.map((ro) => (
                  <tr key={ro.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-4 font-mono text-gray-700 text-xs">{ro.id}</td>
                    <td className="py-3 px-4 text-gray-900">{ro.store}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{ro.box}</td>
                    <td className="py-3 px-4 text-right">{getStatusBadge(ro.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
