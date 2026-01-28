'use client';

import { Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-[#0D3B2E] rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">Z</span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Zuma Tunjungan</h1>
          <p className="text-xs text-gray-500">Jatim Branch</p>
        </div>
      </div>
      
      <button className="relative p-2">
        <Bell className="w-6 h-6 text-gray-600" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
    </header>
  );
}
