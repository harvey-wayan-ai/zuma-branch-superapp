'use client';

import { useState } from 'react';
import { ChevronLeft, Save, ArrowRight, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ROItem {
  id: string;
  store: string;
  status: string;
  articles: { code: string; name: string; ddd: number; ljbb: number }[];
}

export default function ROProcess() {
  const [selectedRO, setSelectedRO] = useState<ROItem | null>(null);
  const [articles, setArticles] = useState(selectedRO?.articles || []);
  const [isSaving, setIsSaving] = useState(false);

  const roList = [
    { id: 'RO-2511-0007', store: 'Zuma Matos', status: 'IN_DELIVERY', articles: [
      { code: 'M1CAV201', name: 'MEN CLASSIC 1, JET BLACK', ddd: 6, ljbb: 0 },
      { code: 'M1DLV101', name: 'MEN DALLAS 1, JET BLACK', ddd: 1, ljbb: 0 },
    ]},
  ];

  const updateQty = (idx: number, field: 'ddd' | 'ljbb', val: number) => {
    const newArticles = [...articles];
    newArticles[idx][field] = Math.max(0, val);
    setArticles(newArticles);
  };

  const saveToSheet = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/update-ro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roId: selectedRO?.id,
          articles: articles
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Saved! Updated ${data.updates} articles in Google Sheets`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedRO) {
    return (
      <div className="space-y-3">
        {roList.map(ro => (
          <div key={ro.id} className="bg-white p-4 rounded-xl border">
            <p className="text-xs text-gray-500">{ro.id}</p>
            <p className="font-semibold">{ro.store}</p>
            <button onClick={() => { setSelectedRO(ro); setArticles(ro.articles); }}
              className="mt-2 w-full bg-[#0D3B2E] text-white py-2 rounded-lg">
              View Details
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setSelectedRO(null)} className="flex items-center gap-2 text-sm">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-[#0D3B2E] text-white p-4 rounded-xl">
        <p className="text-xs opacity-80">{selectedRO.id}</p>
        <p className="font-semibold">{selectedRO.store}</p>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" /> Article Breakdown
        </h3>
        
        {articles.map((article, idx) => (
          <div key={idx} className="border-b py-3 last:border-0">
            <p className="text-xs text-gray-500">{article.code}</p>
            <p className="text-sm font-medium">{article.name}</p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">DDD:</span>
                <input type="number" value={article.ddd} min={0}
                  onChange={(e) => updateQty(idx, 'ddd', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border rounded text-center" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">LJBB:</span>
                <input type="number" value={article.ljbb} min={0}
                  onChange={(e) => updateQty(idx, 'ljbb', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border rounded text-center" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={saveToSheet} disabled={isSaving}
          className="flex-1 bg-[#00D084] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button className="flex-1 bg-[#0D3B2E] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
          Next Stage <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
