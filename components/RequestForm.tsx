'use client';

import { useState } from 'react';
import { Plus, Minus, Trash2, Package, Store, Send, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArticleItem {
  id: string;
  code: string;
  name: string;
  boxes: number;
}

interface AvailableArticle {
  code: string;
  name: string;
  series: string;
  gender: string;
}

export default function RequestForm() {
  const [selectedStore, setSelectedStore] = useState('');
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [tempArticles, setTempArticles] = useState<ArticleItem[]>([]);
  const [notes, setNotes] = useState('');
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // Store list for Jatim Area Supervisor
  const stores = [
    'Zuma Tunjungan Plaza',
    'Zuma Royal Plaza',
    'Zuma Bintaro Xchange',
    'Zuma Galaxy Mall',
    'Zuma Ciputra World',
  ];

  // Special options for warehouse supervisor access
  const specialStores = [
    'Other Need',
    'Wholesale',
    'Consignment',
  ];

  // Available articles database
  const availableArticles: AvailableArticle[] = [
    { code: 'M1AMV102', name: 'MEN AIRMOVE 2, INDIGO TAN', series: 'AIRMOVE', gender: 'MEN' },
    { code: 'M1AMV103', name: 'MEN AIRMOVE 2, BLACK WHITE', series: 'AIRMOVE', gender: 'MEN' },
    { code: 'M1CLV201', name: 'MEN CLASSIC 1, BLACK', series: 'CLASSIC', gender: 'MEN' },
    { code: 'M1CLV202', name: 'MEN CLASSIC 1, WHITE', series: 'CLASSIC', gender: 'MEN' },
    { code: 'M1BSV301', name: 'MEN BLACKSERIES, NAVY', series: 'BLACKSERIES', gender: 'MEN' },
    { code: 'M1BSV302', name: 'MEN BLACKSERIES, BLACK', series: 'BLACKSERIES', gender: 'MEN' },
    { code: 'M1STV101', name: 'MEN STRIPE, GREY', series: 'STRIPE', gender: 'MEN' },
    { code: 'M1LUV101', name: 'MEN LUCA, BROWN', series: 'LUCA', gender: 'MEN' },
    { code: 'M1DAV101', name: 'MEN DALLAS, TAN', series: 'DALLAS', gender: 'MEN' },
    { code: 'W1ELV101', name: 'WOMEN ELSA, PINK', series: 'ELSA', gender: 'WOMEN' },
    { code: 'W1ELV102', name: 'WOMEN ELSA, BLACK', series: 'ELSA', gender: 'WOMEN' },
    { code: 'W1SLV201', name: 'WOMEN SLIDE PUFFY, WHITE', series: 'SLIDE PUFFY', gender: 'WOMEN' },
    { code: 'W1SLV202', name: 'WOMEN SLIDE PUFFY, BLACK', series: 'SLIDE PUFFY', gender: 'WOMEN' },
    { code: 'W1ONV101', name: 'WOMEN ONYX, BLACK', series: 'ONYX', gender: 'WOMEN' },
    { code: 'K1AMV101', name: 'KIDS AIRMOVE, BLUE', series: 'AIRMOVE', gender: 'KIDS' },
    { code: 'K1AMV102', name: 'KIDS AIRMOVE, RED', series: 'AIRMOVE', gender: 'KIDS' },
    { code: 'K1CLV101', name: 'KIDS CLASSIC, BLACK', series: 'CLASSIC', gender: 'KIDS' },
  ];

  // Filter articles based on search and gender
  const filteredArticles = availableArticles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.series.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGender = selectedGender === 'ALL' || article.gender === selectedGender;
    
    // Exclude already added articles
    const notAdded = !articles.some(a => a.code === article.code);
    
    return matchesSearch && matchesGender && notAdded;
  });

  const addArticle = (article: AvailableArticle) => {
    const newItem: ArticleItem = {
      id: Date.now().toString(),
      code: article.code,
      name: article.name,
      boxes: 1,
    };
    setArticles([...articles, newItem]);
    // Keep modal open, just clear search
    setSearchQuery('');
  };

  const removeArticle = (id: string) => {
    setArticles(articles.filter((item) => item.id !== id));
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

  // Generate RO ID locally (format: RO-YYMM-XXXX)
  const generateROId = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 2-digit month
    const random = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
    return `RO-${year}${month}-${random}`;
  };

  const handleSubmit = async () => {
    const roId = generateROId();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Prepare data for Supabase
    const roData = {
      ro_id: roId,
      store_name: selectedStore,
      articles: articles.map(article => ({
        article_code: article.code,
        article_name: article.name,
        boxes_requested: article.boxes,
        pairs_requested: article.boxes * 12
      })),
      total_boxes: totalBoxes,
      total_pairs: totalPairs,
      status: 'QUEUE',
      notes: notes,
      created_at: now.toISOString()
    };
    
    // TODO: Insert to Supabase ro_process table
    // For now, just show success message
    alert(`RO Submitted Successfully!\n\nRO ID: ${roId}\nStore: ${selectedStore}\nArticles: ${articles.length}\nTotal Boxes: ${totalBoxes}\nTotal Pairs: ${totalPairs}\nStatus: QUEUE\nSubmitted: ${formattedDate} at ${formattedTime}\n\nNote: Data will be saved to Supabase ro_process table.`);
    
    // Reset form after submission
    setSelectedStore('');
    setArticles([]);
    setNotes('');
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
        <p className="text-xs opacity-60 mt-1">RO ID will be auto-generated on submit (Format: RO-YYMM-XXXX)</p>
      </div>

      {/* Store Selection */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Store className="w-4 h-4 text-[#0D3B2E]" />
          Destination Store
        </label>
        <div className="relative">
          {/* Searchable Input */}
          <div className="relative">
            <input
              type="text"
              value={storeSearchQuery}
              onChange={(e) => {
                setStoreSearchQuery(e.target.value);
                setShowStoreDropdown(true);
              }}
              onFocus={() => setShowStoreDropdown(true)}
              placeholder={selectedStore || "Search or select store..."}
              className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D084] focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Dropdown */}
          {showStoreDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {/* Regular Stores Section */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                Regular Stores
              </div>
              {stores
                .filter(store => store.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                .map((store) => (
                  <button
                    key={store}
                    onClick={() => {
                      setSelectedStore(store);
                      setStoreSearchQuery('');
                      setShowStoreDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                      selectedStore === store ? 'bg-[#00D084]/10 text-[#0D3B2E] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {store}
                  </button>
                ))}
              
              {/* Special Options Section */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0 border-t">
                Special Options
              </div>
              {specialStores
                .filter(store => store.toLowerCase().includes(storeSearchQuery.toLowerCase()))
                .map((store) => (
                  <button
                    key={store}
                    onClick={() => {
                      setSelectedStore(store);
                      setStoreSearchQuery('');
                      setShowStoreDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                      selectedStore === store ? 'bg-[#00D084]/10 text-[#0D3B2E] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {store}
                  </button>
                ))}
              
              {/* No results */}
              {[...stores, ...specialStores].filter(store => 
                store.toLowerCase().includes(storeSearchQuery.toLowerCase())
              ).length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No stores found
                </div>
              )}
            </div>
          )}
          
          {/* Click outside to close */}
          {showStoreDropdown && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowStoreDropdown(false)}
            />
          )}
        </div>
        
        {/* Selected Store Display */}
        {selectedStore && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">Selected:</span>
            <span className="text-sm font-medium text-[#0D3B2E] bg-[#00D084]/10 px-2 py-1 rounded">
              {selectedStore}
            </span>
            <button
              onClick={() => {
                setSelectedStore('');
                setStoreSearchQuery('');
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Articles List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Articles</h3>
            <p className="text-xs text-gray-500">Minimum 1 box per article (12 pairs)</p>
          </div>
          <div className="flex gap-2">
            {/* Auto Generate Button - Only for regular stores */}
            <Button
              onClick={() => {
                if (!selectedStore) {
                  alert('Please select a destination store first!');
                  return;
                }
                if (specialStores.includes(selectedStore)) {
                  alert('Auto-generate is only available for regular stores, not for Wholesale/Consignment/Other Need.');
                  return;
                }
                // TODO: Fetch auto-generated recommendations from Supabase
                alert(`Auto-generate recommendations for ${selectedStore}\n\nThis will fetch recommendations from ro_recommendations table.`);
              }}
              className="bg-gradient-to-r from-[#0D3B2E] to-[#1a5a48] hover:from-[#1a5a48] hover:to-[#0D3B2E] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              size="sm"
              disabled={!selectedStore || specialStores.includes(selectedStore)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Auto Generate
            </Button>
            
            <Button
              onClick={() => {
                if (!selectedStore) {
                  alert('Please select a destination store first!');
                  return;
                }
                setTempArticles([...articles]);
                setShowArticleSelector(true);
              }}
              className="bg-[#00D084] hover:bg-[#00B874] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
              disabled={!selectedStore}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-2">No articles selected</p>
            <p className="text-gray-400 text-xs">Click the + Add button to select articles for this RO</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div key={article.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-mono">{article.code}</p>
                    <p className="text-sm font-medium text-gray-900">{article.name}</p>
                  </div>
                  <button
                    onClick={() => removeArticle(article.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateBoxes(article.id, article.boxes - 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-50"
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
      )}
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

      {/* Article Selector Modal */}
      {showArticleSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#0D3B2E] text-white">
              <div>
                <h3 className="font-semibold">Select Articles</h3>
                <p className="text-xs opacity-80">{filteredArticles.length} available</p>
              </div>
              <button
                onClick={() => {
                  setArticles(tempArticles);
                  setShowArticleSelector(false);
                  setSearchQuery('');
                  setSelectedGender('ALL');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by code, name, or series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D084] focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2">
                {['ALL', 'MEN', 'WOMEN', 'KIDS'].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedGender === gender
                        ? 'bg-[#0D3B2E] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {gender === 'ALL' ? 'All' : gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Article List */}
            <div className="flex-1 overflow-y-auto">
              {filteredArticles.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No articles found</p>
                  <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.code}
                      onClick={() => addArticle(article)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">{article.code}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            article.gender === 'MEN' ? 'bg-blue-100 text-blue-700' :
                            article.gender === 'WOMEN' ? 'bg-pink-100 text-pink-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {article.gender}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{article.name}</p>
                        <p className="text-xs text-gray-400">{article.series} Series</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#00D084] group-hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Done Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-[#0D3B2E]">{articles.length}</span> article(s) selected
                </div>
                <button
                  onClick={() => {
                    setTempArticles([]);
                    setShowArticleSelector(false);
                    setSearchQuery('');
                    setSelectedGender('ALL');
                  }}
                  className="px-6 py-2 bg-[#00D084] hover:bg-[#00B874] text-white font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedStore || articles.length === 0}
        className="w-full bg-[#00D084] hover:bg-[#00B874] text-white py-6 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-5 h-5 mr-2" />
        Submit RO Request
      </Button>
    </div>
  );
}
