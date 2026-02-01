'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Package, 
  Warehouse, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  Boxes,
  AlertTriangle,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarehouseStock {
  ddd_available: number;
  ljbb_available: number;
  mbb_available: number;
  ubb_available: number;
  total_available: number;
}

interface Article {
  code: string;
  name: string;
  tipe: string | null;
  gender: string | null;
  series: string | null;
  warehouse_stock: WarehouseStock;
}

interface DashboardData {
  summary: {
    totalArticles: number;
    totalStock: number;
    totalDDD: number;
    totalLJBB: number;
    totalMBB: number;
    totalUBB: number;
    totalRO: number;
    availableStock: number;
  };
  breakdown: {
    byGender: Array<{ name: string; value: number }>;
    bySeries: Array<{ name: string; value: number }>;
    byTipe: Array<{ name: string; value: number }>;
  };
  alerts: {
    lowStock: Array<{
      code: string;
      name: string;
      total: number;
      gender: string;
      series: string;
    }>;
  };
  topStock: Array<{
    code: string;
    name: string;
    total: number;
    ddd: number;
    ljbb: number;
    mbb: number;
    ubb: number;
  }>;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
}

function MetricCard({ title, value, subtitle, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className={cn('rounded-xl border p-3', colorClasses[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider">{title}</p>
          <p className="text-lg font-bold mt-0.5">{value}</p>
          {subtitle && <p className="text-[10px] mt-0.5 opacity-70">{subtitle}</p>}
        </div>
        <div className="p-1.5 bg-white/50 rounded-lg">
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export default function WHStockPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ddd' | 'ljbb' | 'mbb' | 'ubb'>('all');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'articles'>('overview');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [articlesRes, dashboardRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/dashboard')
      ]);
      
      const articlesResult = await articlesRes.json();
      const dashboardResult = await dashboardRes.json();
      
      if (!articlesRes.ok) {
        throw new Error(articlesResult.error || 'Failed to fetch articles');
      }
      
      setArticles(articlesResult.data || []);
      setFilteredArticles(articlesResult.data || []);
      
      if (dashboardResult.success) {
        setDashboardData(dashboardResult.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = articles;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.code.toLowerCase().includes(query) ||
          article.name.toLowerCase().includes(query) ||
          (article.tipe?.toLowerCase() || '').includes(query) ||
          (article.gender?.toLowerCase() || '').includes(query) ||
          (article.series?.toLowerCase() || '').includes(query)
      );
    }
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((article) => {
        const stock = article.warehouse_stock;
        switch (selectedFilter) {
          case 'ddd':
            return stock.ddd_available > 0;
          case 'ljbb':
            return stock.ljbb_available > 0;
          case 'mbb':
            return stock.mbb_available > 0;
          case 'ubb':
            return stock.ubb_available > 0;
          default:
            return true;
        }
      });
    }
    
    setFilteredArticles(filtered);
  }, [searchQuery, selectedFilter, articles]);

  const getStockBadgeColor = (stock: number) => {
    if (stock === 0) return 'bg-gray-100 text-gray-500';
    if (stock < 10) return 'bg-red-50 text-red-600';
    if (stock < 50) return 'bg-yellow-50 text-yellow-600';
    return 'bg-green-50 text-green-600';
  };

  const formatStock = (stock: number) => {
    return stock.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 text-[#00D084] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading warehouse data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
        <p className="text-gray-500 text-sm text-center mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#0D3B2E] text-white rounded-lg text-sm font-medium hover:bg-[#0D3B2E]/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const breakdown = dashboardData?.breakdown;
  const alerts = dashboardData?.alerts;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0D3B2E]">WH Stock</h2>
        <span className="text-xs text-gray-500">{filteredArticles.length} articles</span>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'flex-1 py-2 text-xs font-medium rounded-md transition-colors',
            activeTab === 'overview'
              ? 'bg-white text-[#0D3B2E] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={cn(
            'flex-1 py-2 text-xs font-medium rounded-md transition-colors',
            activeTab === 'articles'
              ? 'bg-white text-[#0D3B2E] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Articles
        </button>
      </div>

      {activeTab === 'overview' && summary && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              title="Total Articles"
              value={summary.totalArticles.toLocaleString()}
              subtitle="Unique SKUs"
              icon={Package}
              color="green"
            />
            <MetricCard
              title="Total Stock"
              value={`${(summary.totalStock / 1000).toFixed(1)}K`}
              subtitle={`${(summary.totalStock * 12 / 1000).toFixed(0)}K pairs`}
              icon={Boxes}
              color="blue"
            />
            <MetricCard
              title="Available"
              value={`${(summary.availableStock / 1000).toFixed(1)}K`}
              subtitle="After RO allocations"
              icon={TrendingUp}
              color="purple"
            />
            <MetricCard
              title="RO Ongoing"
              value={summary.totalRO.toLocaleString()}
              subtitle="Boxes allocated"
              icon={ShoppingCart}
              color="orange"
            />
          </div>

          <CollapsibleSection title="Stock by Warehouse" defaultOpen>
            <div className="space-y-2">
              {[
                { name: 'DDD', value: summary.totalDDD, color: 'bg-blue-500' },
                { name: 'LJBB', value: summary.totalLJBB, color: 'bg-purple-500' },
                { name: 'MBB', value: summary.totalMBB, color: 'bg-orange-500' },
                { name: 'UBB', value: summary.totalUBB, color: 'bg-gray-400' },
              ].map((warehouse) => {
                const percentage = summary.totalStock > 0 
                  ? (warehouse.value / summary.totalStock) * 100 
                  : 0;
                return (
                  <div key={warehouse.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700">{warehouse.name}</span>
                      <span className="text-gray-900">{warehouse.value.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', warehouse.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {breakdown && breakdown.byGender.length > 0 && (
            <CollapsibleSection title="By Gender">
              <div className="flex flex-wrap gap-2">
                {breakdown.byGender.slice(0, 6).map((item) => (
                  <div key={item.name} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs font-medium text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-500">{item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {alerts && alerts.lowStock.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-900 text-sm">Low Stock Alerts</span>
                <span className="bg-red-200 text-red-800 text-[10px] px-2 py-0.5 rounded-full">
                  {alerts.lowStock.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {alerts.lowStock.map((item) => (
                  <div key={item.code} className="bg-white rounded-lg p-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono text-gray-500">{item.code}</p>
                      <p className="font-medium text-gray-900">{item.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{item.total}</p>
                      <p className="text-[10px] text-gray-500">left</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'articles' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code, name, tipe, gender, or series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00D084]/20 focus:border-[#00D084]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { key: 'all', label: 'All', icon: Warehouse },
              { key: 'ddd', label: 'DDD', icon: Package },
              { key: 'ljbb', label: 'LJBB', icon: Package },
              { key: 'mbb', label: 'MBB', icon: Package },
              { key: 'ubb', label: 'UBB', icon: Package },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedFilter(key as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  selectedFilter === key
                    ? 'bg-[#0D3B2E] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Articles Found</h3>
              <p className="text-gray-500 text-sm text-center">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'No stock data available'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.code}
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{article.code}</h3>
                        <p className="text-gray-600 text-xs mt-0.5">{article.name}</p>
                      </div>
                      <span className="text-xs font-medium text-[#00D084] bg-[#00D084]/10 px-2 py-1 rounded-full whitespace-nowrap">
                        {formatStock(article.warehouse_stock.total_available)} boxes
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {article.tipe && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {article.tipe}
                        </span>
                      )}
                      {article.gender && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                          {article.gender}
                        </span>
                      )}
                      {article.series && (
                        <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                          {article.series}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'DDD', value: article.warehouse_stock.ddd_available },
                      { label: 'LJBB', value: article.warehouse_stock.ljbb_available },
                      { label: 'MBB', value: article.warehouse_stock.mbb_available },
                      { label: 'UBB', value: article.warehouse_stock.ubb_available },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className={cn(
                          'rounded-lg p-2 text-center',
                          getStockBadgeColor(value)
                        )}
                      >
                        <p className="text-[10px] font-medium opacity-70">{label}</p>
                        <p className="text-sm font-semibold">{formatStock(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
