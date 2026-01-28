'use client';

import { ShoppingCart, Package, Box, Layers } from 'lucide-react';

export default function SummaryCards() {
  const stats = [
    { 
      label: 'Total RO', 
      value: '30', 
      icon: ShoppingCart,
      bgColor: 'bg-[#0D3B2E]',
      textColor: 'text-white'
    },
    { 
      label: 'Queued', 
      value: '13', 
      icon: Package,
      bgColor: 'bg-[#0D3B2E]',
      textColor: 'text-white'
    },
    { 
      label: 'Box', 
      value: '100', 
      icon: Box,
      bgColor: 'bg-[#00D084]',
      textColor: 'text-white'
    },
    { 
      label: 'Pairs', 
      value: '1200', 
      icon: Layers,
      bgColor: 'bg-[#00D084]',
      textColor: 'text-white'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.label}
            className={`${stat.bgColor} rounded-2xl p-4 flex items-center justify-between`}
          >
            <div>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className={`text-sm opacity-80 ${stat.textColor}`}>{stat.label}</p>
            </div>
            <div className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
