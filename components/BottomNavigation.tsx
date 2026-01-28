'use client';

import { useState } from 'react';
import { Home, Search, ShoppingCart, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'home' | 'sku' | 'action' | 'ro' | 'profile';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home' as TabId, label: 'Home', icon: Home },
    { id: 'sku' as TabId, label: 'SKU', icon: Search },
    { id: 'action' as TabId, label: '', icon: Plus, isCenter: true },
    { id: 'ro' as TabId, label: 'RO', icon: ShoppingCart },
    { id: 'profile' as TabId, label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div 
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all duration-200",
                    isActive 
                      ? "bg-[#00D084] scale-110" 
                      : "bg-[#0D3B2E] hover:scale-105"
                  )}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </button>
            );
          }
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center py-2 px-3 min-w-[60px] transition-colors duration-200",
                isActive ? 'text-[#00D084]' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon className={cn("w-6 h-6 mb-1", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
