'use client';

import { useState } from 'react';
import { Plus, Minus, Trash2, Package, Store, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArticleItem {
  id: string;
  code: string;
  name: string;
  boxes: number;
}

export default function RequestForm() {
  const [selectedStore, setSelectedStore] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [articles, setArticles] = useState<ArticleItem[]>([
    { id: '1', code: 'M1AMV102', name: 'MEN AIRMOVE 2, INDIGO TAN', boxes: 1 },
  ]);
  const [notes, setNotes] = useState('');

  // Dummy store list for Jatim Area Supervisor
  const stores = [
    'Zuma Tunjungan Plaza',
    'Zuma Royal Plaza',
    'Zuma Bintaro Xchange',
    'Zuma Galaxy Mall',
    'Zuma Ciputra World',
  ];

  // Dummy article list
  const availableArticles = [
    { code: 'M1AMV102', name: 'MEN AIRMOVE 2, INDIGO TAN' },
    { code: 'M1CLV201', name: 'MEN CLASSIC 1, BLACK' },
    { code: 'M1BSV301', name: 'MEN BLACKSERIES, NAVY' },
    { code: 'W1ELV101', name: 'WOMEN ELSA, PINK' },
    { code: 'W1SLV201', name: 'WOMEN SLIDE PUFFY, WHITE' },
    { code: 'K1AMV101', name: 'KIDS AIRMOVE, BLUE' },
    { code: 'M1STV101', name: 'MEN STRIPE, GREY' },
    { code: 'M1LUV101', name: 'MEN LUCA, BROWN' },
    { code: 'W1ONV101', name: 'WOMEN ONYX, BLACK' },
    { code: 'M1DAV101', name: 'MEN DALLAS, TAN' },
  ];

  const addArticle = () => {
    const randomArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
    const newItem: ArticleItem = {
      id: Date.now().toString(),
      code: randomArticle.code,
      name: randomArticle.name,
      boxes: 1,
    };
    setArticles([...articles, newItem]);
  };

  const removeArticle = (id: string) => {
    if (articles.length > 1) {
      setArticles(articles.filter((item) => item.id !== id));
    }
  };

  const updateBoxes = (id: string, boxes: number) => {
    if (boxes >= 1) {
      setArticles(articles.map((item) => 
        item.id === id ? { ...item, boxes } : item
      ));
    }
  };

  const totalBoxes = articles.reduce((sum, item) => sum + item.boxes, 0);
  const totalPairs = totalBoxes * 12;

  const handleSubmit = () => {
    alert(`RO Submitted!\nStore: ${selectedStore}\nArticles: ${articles.length}\nTotal Boxes: ${totalBoxes}\nTotal Pairs: ${totalPairs}`);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-[#0D3B2E] to-[#1a5a48] rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5" />
          <span className="font-semibold">New Replenishment Order</span>
        </div>
        <p className="text-sm opacity-80">Weekly stock request for your stores</p>
      </div>

      {/* Store Selection */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Store className="w-4 h-4 text-[#0D3B2E]" />
          Destination Store
        </label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D084] focus:border-transparent"
        >
          <option value="">Select Store</option>
          {stores.map((store) => (
            <option key={store} value={store}>{store}</option>
          ))}
        </select>
      </div>

      {/* Delivery Date */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 text-[#0D3B2E]" />
          Requested Delivery Date
        </label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D084] focus:border-transparent"
        />
      </div>

      {/* Articles List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Articles</h3>
            <p className="text-xs text-gray-500">Minimum 1 box per article (12 pairs)</p>
          </div>
          <Button
            onClick={addArticle}
            className="bg-[#00D084] hover:bg-[#00B874] text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="divide-y divide-gray-100">
          {articles.map((article, index) => (
            <div key={article.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-mono">{article.code}</p>
                  <p className="text-sm font-medium text-gray-900">{article.name}</p>
                </div>
                <button
                  onClick={() => removeArticle(article.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={articles.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateBoxes(article.id, article.boxes - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                    disabled={article.boxes <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-[#0D3B2E]">{article.boxes}</p>
                    <p className="text-xs text-gray-500">box</p>
                  </div>
                  
                  <button
                    onClick={() => updateBoxes(article.id, article.boxes + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">= {article.boxes * 12} pairs</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any special instructions..."
          rows={3}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D084] focus:border-transparent resize-none"
        />
      </div>

      {/* Summary */}
      <div className="bg-[#0D3B2E] rounded-xl p-4 text-white">
        <h3 className="font-semibold mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-80">Total Articles:</span>
            <span className="font-semibold">{articles.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-80">Total Boxes:</span>
            <span className="font-semibold">{totalBoxes}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-80">Total Pairs:</span>
            <span className="font-semibold">{totalPairs}</span>
          </div>
          <div className="border-t border-white/20 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="opacity-80">Destination:</span>
              <span className="font-semibold text-right">{selectedStore || 'Not selected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedStore || !deliveryDate}
        className="w-full bg-[#00D084] hover:bg-[#00B874] text-white py-6 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-5 h-5 mr-2" />
        Submit RO Request
      </Button>
    </div>
  );
}
