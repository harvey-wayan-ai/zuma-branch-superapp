'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Package, Filter, Warehouse, Loader2 } from 'lucide-react';
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

export default function WHStockPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ddd' | 'ljbb' | 'mbb' | 'ubb'>('all');

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/articles');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch articles');
      }
      
      setArticles(result.data || []);
      setFilteredArticles(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    let filtered = articles;
    
    // Apply search filter
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
    
    // Apply warehouse filter
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
        <p className="text-gray-500 text-sm">Loading warehouse stock...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Stock</h3>
        <p className="text-gray-500 text-sm text-center mb-4">{error}</p>
        <button
          onClick={fetchArticles}
          className="px-4 py-2 bg-[#0D3B2E] text-white rounded-lg text-sm font-medium hover:bg-[#0D3B2E]/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0D3B2E]">Warehouse Stock</h2>
        <span className="text-xs text-gray-500">{filteredArticles.length} articles</span>
      </div>

      {/* Search Bar */}
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

      {/* Warehouse Filter */}
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

      {/* Articles List */}
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
              {/* Article Header */}
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
                
                {/* Metadata Tags */}
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

              {/* Stock Grid */}
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
    </div>
  );
}