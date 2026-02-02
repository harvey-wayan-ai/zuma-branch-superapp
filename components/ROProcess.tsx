'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ROArticle {
  kodeArtikel: string;
  namaArtikel: string;
  boxesRequested: number;
  dddBoxes: number;
  ljbbBoxes: number;
}

interface ROItem {
  id: string;
  store: string;
  createdAt: string;
  currentStatus: ROStatus;
  dnpbNumber: string | null;
  totalBoxes: number;
  totalArticles: number;
  dddBoxes: number;
  ljbbBoxes: number;
  articles: ROArticle[];
}

type ROStatus = 'QUEUE' | 'APPROVED' | 'PICKING' | 'PICK_VERIFIED' | 'DNPB_PROCESS' | 'READY_TO_SHIP' | 'IN_DELIVERY' | 'ARRIVED' | 'COMPLETED';

const statusFlow: { id: ROStatus; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'QUEUE', label: 'Queue', icon: Clock, description: 'Awaiting approval' },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2, description: 'WH Supervisor approved' },
  { id: 'PICKING', label: 'Picking', icon: Package, description: 'Being picked from warehouse' },
  { id: 'PICK_VERIFIED', label: 'Verified', icon: CheckCircle2, description: 'Pick quantities verified' },
  { id: 'DNPB_PROCESS', label: 'DNPB', icon: Database, description: 'Delivery note processing' },
  { id: 'READY_TO_SHIP', label: 'Ready', icon: Package, description: 'Ready for dispatch' },
  { id: 'IN_DELIVERY', label: 'Delivery', icon: Truck, description: 'Out for delivery' },
  { id: 'ARRIVED', label: 'Arrived', icon: Home, description: 'Received at store' },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2, description: 'Order closed' },
];

export default function ROProcess() {
  const [selectedRO, setSelectedRO] = useState<ROItem | null>(null);
  const [viewArticles, setViewArticles] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONGOING' | 'SHIPPING' | 'COMPLETE'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [roData, setRoData] = useState<ROItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dnpbInput, setDnpbInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editedArticles, setEditedArticles] = useState<Record<string, { ddd: number; ljbb: number }>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchROData();
  }, []);

  useEffect(() => {
    if (selectedRO?.dnpbNumber) {
      setDnpbInput(selectedRO.dnpbNumber);
    } else {
      setDnpbInput('');
    }
  }, [selectedRO?.id]);

  const fetchROData = async (): Promise<ROItem[]> => {
    setIsLoadingData(true);
    try {
      const response = await fetch('/api/ro/process');
      const result = await response.json();
      if (result.success) {
        setRoData(result.data);
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching RO data:', error);
      return [];
    } finally {
      setIsLoadingData(false);
    }
  };

  const filteredROList = useMemo(() => {
    const ONGOING_STATUSES: ROStatus[] = ['QUEUE', 'APPROVED', 'PICKING', 'PICK_VERIFIED', 'DNPB_PROCESS'];
    const SHIPPING_STATUSES: ROStatus[] = ['READY_TO_SHIP', 'IN_DELIVERY', 'ARRIVED'];
    
    return roData.filter(ro => {
      let matchesStatus = false;
      if (filterStatus === 'ALL') matchesStatus = true;
      else if (filterStatus === 'ONGOING') matchesStatus = ONGOING_STATUSES.includes(ro.currentStatus);
      else if (filterStatus === 'SHIPPING') matchesStatus = SHIPPING_STATUSES.includes(ro.currentStatus);
      else if (filterStatus === 'COMPLETE') matchesStatus = ro.currentStatus === 'COMPLETED';
      
      const matchesSearch = searchQuery === '' || 
        ro.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ro.store.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [roData, filterStatus, searchQuery]);

  const getStatusColor = (status: ROStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'IN_DELIVERY':
        return 'bg-blue-100 text-blue-700';
      case 'DNPB_PROCESS':
        return 'bg-yellow-100 text-yellow-700';
      case 'QUEUE':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-[#0D3B2E]/10 text-[#0D3B2E]';
    }
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await fetchROData();
    setIsLoading(false);
  }, []);

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

      <div className="relative">
        <input
          type="text"
          placeholder="Search RO ID or Store..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00D084] focus:border-transparent"
        />
        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'ONGOING', label: 'Ongoing' },
          { key: 'SHIPPING', label: 'Shipping' },
          { key: 'COMPLETE', label: 'Complete' },
          { key: 'ALL', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key as 'ALL' | 'ONGOING' | 'SHIPPING' | 'COMPLETE')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              filterStatus === key 
                ? "bg-[#0D3B2E] text-white" 
                : "bg-gray-100 text-gray-600"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* RO Cards */}
      {isLoadingData ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : filteredROList.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No RO requests found</p>
          <p className="text-gray-400 text-sm">Submit an RO from the Request tab</p>
        </div>
      ) : (
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
      )}
    </div>
  );

  const renderRODetail = () => {
    if (!selectedRO) return null;

    const currentStatusIndex = statusFlow.findIndex(s => s.id === selectedRO.currentStatus);

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => {
            if (dnpbInput && dnpbInput !== selectedRO.dnpbNumber && !confirm('You have unsaved DNPB. Discard it?')) return;
            setSelectedRO(null);
            setViewArticles(false);
          }}
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

        {selectedRO.currentStatus === 'DNPB_PROCESS' && (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <label className="block text-sm font-medium text-yellow-800 mb-2">
              📝 DNPB Number (Required)
            </label>
            <input
              type="text"
              placeholder="DNPB/DDD/WHS/2026/I/001"
              value={dnpbInput}
              onChange={(e) => setDnpbInput(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
            />
            {selectedRO.dnpbNumber && (
              <p className="mt-2 text-xs text-yellow-700">Current: {selectedRO.dnpbNumber}</p>
            )}
          </div>
        )}

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
          <button 
            onClick={() => setViewArticles(true)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" /> View Articles
          </button>
          <button 
            onClick={async () => {
              const currentIndex = statusFlow.findIndex(s => s.id === selectedRO.currentStatus);
              if (currentIndex >= statusFlow.length - 1) {
                toast.info('Order already completed');
                return;
              }
              
              const nextStatus = statusFlow[currentIndex + 1];
              if (!confirm(`Advance status to "${nextStatus.label}"?`)) return;
              
              if (selectedRO.currentStatus === 'DNPB_PROCESS') {
                const dnpbToSave = dnpbInput || selectedRO.dnpbNumber;
                if (!dnpbToSave) {
                  toast.warning('DNPB Number is required before proceeding');
                  return;
                }
                
                setIsLoading(true);
                try {
                  const dnpbRes = await fetch('/api/ro/dnpb', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roId: selectedRO.id, dnpbNumber: dnpbToSave })
                  });
                  const dnpbResult = await dnpbRes.json();
                  if (!dnpbResult.success) {
                    toast.error(`DNPB Error: ${dnpbResult.error}`);
                    setIsLoading(false);
                    return;
                  }
                } catch (error) {
                  toast.error('Failed to save DNPB number');
                  setIsLoading(false);
                  return;
                }
              }
              
              setIsLoading(true);
              
              try {
                const res = await fetch('/api/ro/status', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ roId: selectedRO.id, status: nextStatus.id })
                });
                
                const result = await res.json();
                
                if (result.success) {
                  setSelectedRO({ ...selectedRO, currentStatus: nextStatus.id, dnpbNumber: dnpbInput || selectedRO.dnpbNumber });
                  setDnpbInput('');
                  fetchROData();
                  toast.success(`Status updated to ${nextStatus.label}`);
                } else {
                  toast.error(result.error);
                }
              } catch (error) {
                toast.error('Failed to update status');
                console.error(error);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading || statusFlow.findIndex(s => s.id === selectedRO.currentStatus) >= statusFlow.length - 1}
            className="flex-1 bg-[#00D084] text-white py-3 rounded-xl font-medium hover:bg-[#00B874] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>Next Stage <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    );
  };

  const getArticleValues = useCallback((article: ROArticle) => {
    const edited = editedArticles[article.kodeArtikel];
    return {
      ddd: edited?.ddd ?? article.dddBoxes,
      ljbb: edited?.ljbb ?? article.ljbbBoxes,
    };
  }, [editedArticles]);

  const updateArticleQty = useCallback((articleCode: string, field: 'ddd' | 'ljbb', delta: number) => {
    if (!selectedRO) return;
    const article = selectedRO.articles.find(a => a.kodeArtikel === articleCode);
    if (!article) return;
    
    const edited = editedArticles[article.kodeArtikel];
    const current = {
      ddd: edited?.ddd ?? article.dddBoxes,
      ljbb: edited?.ljbb ?? article.ljbbBoxes,
    };
    const newValue = Math.max(0, current[field] + delta);
    
    setEditedArticles(prev => ({
      ...prev,
      [articleCode]: {
        ...current,
        [field]: newValue,
      }
    }));
  }, [selectedRO, editedArticles]);

  const setArticleQty = useCallback((articleCode: string, field: 'ddd' | 'ljbb', value: number) => {
    if (!selectedRO) return;
    const article = selectedRO.articles.find(a => a.kodeArtikel === articleCode);
    if (!article) return;
    
    const edited = editedArticles[article.kodeArtikel];
    const current = {
      ddd: edited?.ddd ?? article.dddBoxes,
      ljbb: edited?.ljbb ?? article.ljbbBoxes,
    };
    const sanitizedValue = Math.max(0, Math.floor(value) || 0);
    
    setEditedArticles(prev => ({
      ...prev,
      [articleCode]: {
        ...current,
        [field]: sanitizedValue,
      }
    }));
  }, [selectedRO, editedArticles]);

  const saveArticleChanges = async () => {
    if (!selectedRO || Object.keys(editedArticles).length === 0) return;
    
    setIsSaving(true);
    try {
      const updatePromises = Object.entries(editedArticles).map(async ([articleCode, values]) => {
        const res = await fetch('/api/ro/articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roId: selectedRO.id,
            articleCode,
            dddBoxes: values.ddd,
            ljbbBoxes: values.ljbb,
          })
        });
        const result = await res.json();
        return { articleCode, success: result.success, error: result.error };
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => !r.success);
      
      if (errors.length > 0) {
        toast.error(`Failed to update: ${errors.map(e => e.articleCode).join(', ')}`);
      }
      
      setEditedArticles({});
      const freshData = await fetchROData();
      
      if (errors.length === 0) {
        toast.success('Changes saved successfully');
        if (freshData.length > 0) {
          const updatedRO = freshData.find(ro => ro.id === selectedRO.id);
          if (updatedRO) {
            setSelectedRO(updatedRO);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to save changes');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(editedArticles).length > 0;

  const renderArticlesView = () => {
    if (!selectedRO) return null;

    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            if (hasChanges && !confirm('You have unsaved changes. Discard them?')) return;
            setViewArticles(false);
            setEditedArticles({});
          }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to RO Detail
        </button>

        <div className="bg-[#0D3B2E] rounded-xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-80 font-mono">{selectedRO.id}</p>
              <p className="font-semibold">{selectedRO.store}</p>
            </div>
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
              {selectedRO.currentStatus}
            </span>
          </div>
          <p className="text-sm opacity-80 mt-2">{selectedRO.totalArticles} articles • {selectedRO.totalBoxes} boxes</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Article Breakdown</h3>
            {hasChanges && (
              <button
                onClick={saveArticleChanges}
                disabled={isSaving}
                className="px-4 py-1.5 bg-[#00D084] text-white text-sm font-medium rounded-lg hover:bg-[#00B874] disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                Save Changes
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-3 font-medium">Article</th>
                  <th className="py-3 px-2 font-medium text-center">Box</th>
                  <th className="py-3 px-2 font-medium text-center text-blue-600">DDD</th>
                  <th className="py-3 px-2 font-medium text-center text-purple-600">LJBB</th>
                </tr>
              </thead>
              <tbody>
                {selectedRO.articles.map((article, idx) => {
                  const values = getArticleValues(article);
                  const isEdited = !!editedArticles[article.kodeArtikel];
                  return (
                    <tr key={idx} className={cn("border-b border-gray-50 last:border-0", isEdited && "bg-yellow-50")}>
                      <td className="py-3 px-3">
                        <p className="font-mono text-xs text-gray-500">{article.kodeArtikel}</p>
                        <p className="text-gray-900 text-xs truncate max-w-[150px]">{article.namaArtikel}</p>
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-gray-900">{values.ddd + values.ljbb}</td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateArticleQty(article.kodeArtikel, 'ddd', -1)} disabled={values.ddd <= 0} className="w-6 h-6 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold">-</button>
                          <input
                            type="number"
                            min="0"
                            value={values.ddd}
                            onChange={(e) => setArticleQty(article.kodeArtikel, 'ddd', parseInt(e.target.value) || 0)}
                            className="w-10 h-6 text-center text-blue-700 font-medium text-xs bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => updateArticleQty(article.kodeArtikel, 'ddd', 1)} className="w-6 h-6 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-bold">+</button>
                        </div>
                      </td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateArticleQty(article.kodeArtikel, 'ljbb', -1)} disabled={values.ljbb <= 0} className="w-6 h-6 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold">-</button>
                          <input
                            type="number"
                            min="0"
                            value={values.ljbb}
                            onChange={(e) => setArticleQty(article.kodeArtikel, 'ljbb', parseInt(e.target.value) || 0)}
                            className="w-10 h-6 text-center text-purple-700 font-medium text-xs bg-white border border-purple-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => updateArticleQty(article.kodeArtikel, 'ljbb', 1)} className="w-6 h-6 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-xs font-bold">+</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const totals = selectedRO.articles.reduce((acc, article) => {
                    const values = getArticleValues(article);
                    return { ddd: acc.ddd + values.ddd, ljbb: acc.ljbb + values.ljbb };
                  }, { ddd: 0, ljbb: 0 });
                  return (
                    <tr className="bg-gray-50 font-medium">
                      <td className="py-3 px-3 text-gray-700">Total</td>
                      <td className="py-3 px-2 text-center text-gray-900">{totals.ddd + totals.ljbb}</td>
                      <td className="py-3 px-2 text-center text-blue-700">{totals.ddd}</td>
                      <td className="py-3 px-2 text-center text-purple-700">{totals.ljbb}</td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {viewArticles ? renderArticlesView() : (selectedRO ? renderRODetail() : renderROList())}
    </div>
  );
}
