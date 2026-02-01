'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Boxes,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className={cn('rounded-xl border p-4', colorClasses[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
        </div>
        <div className="p-2 bg-white/50 rounded-lg">
          <Icon className="w-5 h-5" />
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
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

interface BreakdownBarProps {
  items: Array<{ name: string; value: number }>;
  total: number;
  colors?: string[];
}

function BreakdownBar({ items, total, colors = ['#00D084', '#0D3B2E', '#3B82F6', '#8B5CF6', '#F59E0B'] }: BreakdownBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex h-4 rounded-full overflow-hidden">
        {items.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={item.name}
              style={{
                width: `${percentage}%`,
                backgroundColor: colors[index % colors.length],
              }}
              className="transition-all duration-300"
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {items.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-gray-600 truncate">{item.name}</span>
            <span className="text-gray-900 font-medium ml-auto">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D084]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, breakdown, alerts, topStock } = data;

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-gradient-to-br from-[#0D3B2E] to-[#1a5a48] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Warehouse className="w-5 h-5" />
          <span className="font-semibold">Warehouse Dashboard</span>
        </div>
        <p className="text-sm opacity-80">Real-time stock overview across all locations</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Total Articles"
          value={summary.totalArticles.toLocaleString()}
          subtitle="Unique SKUs"
          icon={Package}
          color="green"
        />
        <MetricCard
          title="Total Stock"
          value={`${summary.totalStock.toLocaleString()} boxes`}
          subtitle={`${(summary.totalStock * 12).toLocaleString()} pairs`}
          icon={Boxes}
          color="blue"
        />
        <MetricCard
          title="Available"
          value={summary.availableStock.toLocaleString()}
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
        <div className="space-y-3">
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
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{warehouse.name}</span>
                  <span className="text-gray-900">{warehouse.value.toLocaleString()} boxes</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', warehouse.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</p>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {breakdown.byGender.length > 0 && (
        <CollapsibleSection title="Stock by Gender">
          <BreakdownBar 
            items={breakdown.byGender} 
            total={summary.totalStock}
          />
        </CollapsibleSection>
      )}

      {breakdown.bySeries.length > 0 && (
        <CollapsibleSection title="Stock by Series">
          <BreakdownBar 
            items={breakdown.bySeries} 
            total={summary.totalStock}
            colors={['#0D3B2E', '#00D084', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']}
          />
        </CollapsibleSection>
      )}

      {breakdown.byTipe.length > 0 && (
        <CollapsibleSection title="Stock by Type">
          <BreakdownBar 
            items={breakdown.byTipe} 
            total={summary.totalStock}
            colors={['#10B981', '#0D3B2E', '#3B82F6', '#F59E0B']}
          />
        </CollapsibleSection>
      )}

      {alerts.lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-900">Low Stock Alerts</span>
            <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full">
              {alerts.lowStock.length}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.lowStock.map((item) => (
              <div key={item.code} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-500">{item.code}</p>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.gender} • {item.series}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{item.total}</p>
                  <p className="text-xs text-gray-500">boxes left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CollapsibleSection title="Top 10 Highest Stock">
        <div className="space-y-2">
          {topStock.map((item, index) => (
            <div key={item.code} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-[#0D3B2E] text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-500 truncate">{item.code}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#0D3B2E]">{item.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">boxes</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
