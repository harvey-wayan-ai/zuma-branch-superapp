'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  Home,
  ChevronRight,
  RefreshCw,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ROItem {
  id: string;
  store: string;
  createdAt: string;
  currentStatus: ROStatus;
  totalBoxes: number;
  totalArticles: number;
  dddBoxes: number;
  ljbbBoxes: number;
}

type ROStatus = 'QUEUE' | 'APPROVED' | 'PICKING' | 'PICK_VERIFIED' | 'READY_TO_SHIP' | 'IN_DELIVERY' | 'ARRIVED' | 'COMPLETED' | 'DELIVERY' | 'DNPB PROCESS';

const statusFlow: { id: ROStatus; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'QUEUE', label: 'Queue', icon: Clock, description: 'Awaiting approval' },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2, description: 'WH Supervisor approved' },
  { id: 'PICKING', label: 'Picking', icon: Package, description: 'Being picked from warehouse' },
  { id: 'PICK_VERIFIED', label: 'Verified', icon: CheckCircle2, description: 'Pick quantities verified' },
  { id: 'READY_TO_SHIP', label: 'Ready', icon: Package, description: 'Ready for dispatch' },
  { id: 'IN_DELIVERY', label: 'Delivery', icon: Truck, description: 'Out for delivery' },
  { id: 'ARRIVED', label: 'Arrived', icon: Home, description: 'Received at store' },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2, description: 'Order closed' },
];

// Real data from Google Sheets
const realROData: ROItem[] = [
  { 
    id: 'RO-2511-0007', 
    store: 'Zuma Matos', 
    createdAt: '26/11/2025', 
    currentStatus: 'DELIVERY',
    totalBoxes: 16,
    totalArticles: 11,
    dddBoxes: 12,
    ljbbBoxes: 4
  },
  { 
    id: 'RO-2512-0008', 
    store: 'Zuma Sunrise Mall', 
    createdAt: '02/12/2025', 
    currentStatus: 'DELIVERY',
    totalBoxes: 9,
    totalArticles: 8,
    dddBoxes: 4,
    ljbbBoxes: 5
  },
  { 
    id: 'RO-2512-0009', 
    store: 'Zuma Royal Plaza', 
    createdAt: '02/12/2025', 
    currentStatus: 'DNPB PROCESS',
    totalBoxes: 11,
    totalArticles: 8,
    dddBoxes: 11,
    ljbbBoxes: 0
  },
  { 
    id: 'RO-2512-0010', 
    store: 'Zuma Royal Plaza', 
    createdAt: '02/12/2025', 
    currentStatus: 'COMPLETED',
    totalBoxes: 32,
    totalArticles: 1,
    dddBoxes: 32,
    ljbbBoxes: 0
  },
  { 
    id: 'RO-2512-0011', 
    store: 'Zuma Sunrise Mall', 
    createdAt: '02/12/2025', 
    currentStatus: 'DNPB PROCESS',
    totalBoxes: 85,
    totalArticles: 1,
    dddBoxes: 0,
    ljbbBoxes: 85
  },
];

export default function ROProcess() {
  const [selectedRO, setSelectedRO] = useState<ROItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<ROStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const filteredROList = filterStatus === 'ALL' 
    ? realROData 
    : realROData.filter(ro => ro.currentStatus === filterStatus);

  const getStatusColor = (status: ROStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'DELIVERY':
        return 'bg-blue-100 text-blue-700';
      case 'DNPB PROCESS':
        return 'bg-yellow-100 text-yellow-700';
      case 'QUEUE':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-[#0D3B2E]/10 text-[#0D3B2E]';
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const renderROList = () => (
    <div className="space-y-3">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#0D3B2E]" />
          <span className="text-sm font-medium text-gray-700">Live Data</span>
        </div>
        <button 
          onClick={refreshData}
          className={cn("p-2 hover:bg-gray-100 rounded-lg transition-colors", isLoading && "animate-spin")}
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
            filterStatus === 'ALL' 
              ? "bg-[#0D3B2E] text-white" 
              : "bg-gray-100 text-gray-600"
          )}
        >
          All
        </button>
        {['DELIVERY', 'DNPB PROCESS', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as ROStatus)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              filterStatus === status 
                ? "bg-[#0D3B2E] text-white" 
                : "bg-gray-100 text-gray-600"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* RO Cards */}
      <div className="space-y-3">
        {filteredROList.map((ro) => (
          <button
            key={ro.id}
            onClick={() => setSelectedRO(ro)}
            className="w-full bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-[#00D084] transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-gray-500 font-mono">{ro.id}</p>
                <p className="font-semibold text-gray-900">{ro.store}</p>
              </div>
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(ro.currentStatus))}>
                {ro.currentStatus}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{ro.totalArticles} articles</span>
              <span>•</span>
              <span>{ro.totalBoxes} boxes</span>
              <span>•</span>
              <span>{ro.createdAt}</span>
            </div>
            
            <div className="mt-2 flex gap-2 text-xs">
              {ro.dddBoxes > 0 && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">DDD: {ro.dddBoxes}</span>
              )}
              {ro.ljbbBoxes > 0 && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">LJBB: {ro.ljbbBoxes}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderRODetail = () => {
    if (!selectedRO) return null;

    const currentStatusIndex = statusFlow.findIndex(s => s.id === selectedRO.currentStatus);

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => setSelectedRO(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to List
        </button>

        {/* RO Header */}
        <div className="bg-[#0D3B2E] rounded-xl p-4 text-white">
          <p className="text-xs opacity-80 font-mono">{selectedRO.id}</p>
          <p className="font-semibold">{selectedRO.store}</p>
          <div className="flex items-center gap-4 mt-2 text-sm opacity-80">
            <span>{selectedRO.totalArticles} articles</span>
            <span>•</span>
            <span>{selectedRO.totalBoxes} boxes</span>
          </div>
          <div className="mt-2 flex gap-2">
            {selectedRO.dddBoxes > 0 && (
              <span className="px-2 py-1 bg-white/20 rounded text-xs">DDD: {selectedRO.dddBoxes} boxes</span>
            )}
            {selectedRO.ljbbBoxes > 0 && (
              <span className="px-2 py-1 bg-white/20 rounded text-xs">LJBB: {selectedRO.ljbbBoxes} boxes</span>
            )}
          </div>
        </div>

        {/* Process Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
          
          <div className="space-y-0">
            {statusFlow.map((status, index) => {
              const Icon = status.icon;
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              return (
                <div key={status.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isCompleted 
                          ? isCurrent 
                            ? "bg-[#00D084] text-white" 
                            : "bg-[#0D3B2E] text-white"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < statusFlow.length - 1 && (
                      <div 
                        className={cn(
                          "w-0.5 h-8 my-1",
                          index < currentStatusIndex ? "bg-[#0D3B2E]" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                  
                  <div className={cn("pb-6", index === statusFlow.length - 1 && "pb-0")}>
                    <p 
                      className={cn(
                        "font-medium",
                        isCompleted ? "text-gray-900" : "text-gray-400"
                      )}
                    >
                      {status.label}
                    </p>
                    <p className="text-xs text-gray-500">{status.description}</p>
                    
                    {isCurrent && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#00D084]/10 text-[#00D084] text-xs rounded-full font-medium">
                        Current Status
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
            View Details
          </button>
          <button className="flex-1 bg-[#00D084] text-white py-3 rounded-xl font-medium hover:bg-[#00B874] transition-colors">
            Track Order
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {selectedRO ? renderRODetail() : renderROList()}
    </div>
  );
}
