'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesItem {
  name: string;
  value: string;
  change: number;
}

interface SalesSectionProps {
  title: string;
  items: SalesItem[];
  filter?: string;
}

function SalesSection({ title, items, filter }: SalesSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50';
    if (change < 0) return 'text-red-500 bg-red-50';
    return 'text-gray-500 bg-gray-100';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3">
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          {filter && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              {filter}
              <ChevronDown className="w-3 h-3" />
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] text-gray-500 border-b border-gray-50">
                <th className="py-2 px-3 font-medium">Branch</th>
                <th className="py-2 px-3 font-medium">Value</th>
                <th className="py-2 px-3 font-medium text-right">vs. Last</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 px-3 text-gray-900">{item.name}</td>
                  <td className="py-2 px-3 text-gray-700 font-medium">{item.value}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${getChangeColor(item.change)}`}>
                      {Math.abs(item.change)}%
                      {getChangeIcon(item.change)}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="py-2 px-3 text-gray-900">TOTAL</td>
                <td className="py-2 px-3 text-gray-900">RpXX B</td>
                <td className="py-2 px-3 text-right">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium text-green-600 bg-green-50">
                    10.5%
                    <TrendingUp className="w-3 h-3" />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [metricFilter, setMetricFilter] = useState('By Revenue');

  const salesByBranch: SalesItem[] = [
    { name: 'Bali', value: 'Rp2,7 B', change: 10.5 },
    { name: 'Jatim', value: 'Rp1 B', change: -11.0 },
    { name: 'Jakarta', value: 'Rp320 M', change: 10.5 },
    { name: 'Sumatra', value: 'Rp110 M', change: 10.5 },
    { name: 'Sulawesi', value: 'Rp78 M', change: 10.5 },
    { name: 'Batam', value: 'Rp26 M', change: 10.5 },
  ];

  const salesByArea: SalesItem[] = [
    { name: 'Bali 1', value: 'Rp2,7 B', change: 10.5 },
    { name: 'Bali 2', value: 'Rp1 B', change: -11.0 },
    { name: 'Jatim', value: 'Rp320 M', change: 10.5 },
    { name: 'Bali 3', value: 'Rp110 M', change: -11.0 },
    { name: 'Jakarta', value: 'Rp78 M', change: 10.5 },
    { name: 'Sumatra', value: 'Rp78 M', change: 0 },
    { name: 'Sulawesi', value: 'Rp78 M', change: 10.5 },
    { name: 'Batam', value: 'Rp78 M', change: 10.5 },
  ];

  const salesByStore: SalesItem[] = [
    { name: 'Zuma Tunjungan', value: 'Rp400 M', change: 10.5 },
    { name: 'Zuma Galaxy', value: 'Rp1 B', change: -11.0 },
    { name: 'Zuma Lorem', value: 'Rp320 M', change: 10.5 },
    { name: 'Zuma Lorem', value: 'Rp110 M', change: -11.0 },
    { name: 'Zuma Lorem', value: 'Rp78 M', change: 0 },
    { name: 'Zuma Lorem', value: 'Rp78 M', change: 10.5 },
    { name: 'Zuma Lorem', value: 'Rp78 M', change: 10.5 },
    { name: 'Zuma Lorem', value: 'Rp78 M', change: 10.5 },
  ];

  const salesByGender: SalesItem[] = [
    { name: 'MEN', value: 'Rp1 B', change: -11.0 },
    { name: 'LADIES', value: 'Rp1 B', change: -11.0 },
    { name: 'BABY', value: 'Rp320 M', change: 10.5 },
    { name: 'BOYS', value: 'Rp110 M', change: -11.0 },
    { name: 'GIRLS', value: 'Rp78 M', change: 10.5 },
    { name: 'JUNIOR', value: 'Rp78 M', change: 0 },
    { name: 'KIDS', value: 'Rp78 M', change: 10.5 },
    { name: 'NULL', value: 'Rp78 M', change: 10.5 },
  ];

  const salesBySeries: SalesItem[] = [
    { name: 'CLASSIC', value: 'Rp1 B', change: -11.0 },
    { name: 'STRIPE', value: 'Rp1 B', change: -11.0 },
    { name: 'BLACKSERIES', value: 'Rp320 M', change: 10.5 },
    { name: 'AIRMOVE', value: 'Rp110 M', change: -11.0 },
    { name: 'LUCA', value: 'Rp78 M', change: 10.5 },
    { name: 'ONYX', value: 'Rp78 M', change: 0 },
    { name: 'SLIDE', value: 'Rp78 M', change: 10.5 },
    { name: 'DALLAS', value: 'Rp78 M', change: 10.5 },
  ];

  const salesByArticle: SalesItem[] = [
    { name: 'JET BLACK', value: 'Rp1 B', change: -11.0 },
    { name: 'GREY GREY', value: 'Rp1 B', change: -11.0 },
    { name: 'NAVY NAVY', value: 'Rp320 M', change: 10.5 },
    { name: 'NAVY GREY', value: 'Rp110 M', change: -11.0 },
    { name: 'BROWN', value: 'Rp78 M', change: 10.5 },
    { name: 'DARK GREY', value: 'Rp78 M', change: 0 },
    { name: 'DARK GREEN', value: 'Rp78 M', change: 10.5 },
    { name: 'MOCHA', value: 'Rp78 M', change: 10.5 },
  ];

  const salesBySize: SalesItem[] = [
    { name: 'MEN CLASSIC 1, 41, JET BLACK', value: 'Rp400 M', change: 10.5 },
    { name: 'MEN CLASSIC 1, 42, JET BLACK', value: 'Rp400 M', change: 10.5 },
    { name: 'MEN CLASSIC 1, 39, JET BLACK', value: 'Rp400 M', change: 10.5 },
    { name: 'MEN CLASSIC 1, 40, JET BLACK', value: 'Rp400 M', change: 10.5 },
    { name: 'MEN CLASSIC 1, 44, JET BLACK', value: 'Rp400 M', change: 10.5 },
    { name: 'MEN CLASSIC 1, 43, JET BLACK', value: 'Rp400 M', change: 10.5 },
  ];

  return (
    <div className="space-y-3 pb-24">
      {/* Filters */}
      <div className="flex gap-2">
        <button className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200">
          {metricFilter}
          <ChevronDown className="w-3 h-3" />
        </button>
        <button className="flex items-center gap-1 px-3 py-2 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200">
          {timeFilter}
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-br from-[#0D3B2E] to-[#1a5a48] rounded-xl p-4 text-white">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs opacity-80">Total Revenue</p>
            <p className="text-3xl font-bold">Rp4,57 B</p>
          </div>
          <div className="flex gap-1">
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded">This Month</span>
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded">This Week</span>
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded">Custom</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-300">
            +22.45%
            <TrendingUp className="w-3 h-3" />
          </span>
          <span className="text-xs opacity-60">vs last month</span>
        </div>
      </div>

      {/* Sales Sections */}
      <SalesSection title="Sales by Branch" items={salesByBranch} />
      <SalesSection title="Sales by Area" items={salesByArea} />
      <SalesSection title="Sales by Store" items={salesByStore} filter="Jatim" />
      <SalesSection title="Sales by Gender" items={salesByGender} filter="Zuma Tunjungan" />
      <SalesSection title="Sales by Series" items={salesBySeries} filter="MEN" />
      <SalesSection title="Sales by Article" items={salesByArticle} filter="CLASSIC" />
      <SalesSection title="Sales by Size" items={salesBySize} filter="JET BLACK" />
    </div>
  );
}
