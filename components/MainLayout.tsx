'use client';

import { useState } from 'react';
import BottomNavigation from '@/components/BottomNavigation';
import ROPage from '@/components/ROPage';
import SettingsPage from '@/components/SettingsPage';
import HomePage from '@/components/HomePage';
import WHStockPage from '@/components/WHStockPage';
import { Home, Search, ShoppingCart, User, Plus, Settings } from 'lucide-react';

type TabId = 'home' | 'sku' | 'action' | 'ro' | 'profile';

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'sku':
        return <WHStockPage />;
      case 'action':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 bg-[#00D084]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-12 h-12 text-[#00D084]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0D3B2E] mb-2">Quick Action</h2>
              <p className="text-gray-500">Future Feature</p>
            </div>
          </div>
        );
      case 'ro':
        return <ROPage />;
      case 'profile':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <img 
              src="/zuma-logo.png" 
              alt="Zuma Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-semibold text-gray-900">Zuma Super App</span>
          </div>
        </div>
      </header>
      
      <main className="p-4 pb-24">
        <div className="max-w-md mx-auto h-[calc(100vh-180px)]">
          {renderContent()}
        </div>
      </main>
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
