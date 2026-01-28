export default function SalesPerformance() {
  return (
    <div className="bg-zinc-800 p-4 rounded-lg mb-6">
      <h2 className="text-zinc-400 text-sm mb-2">Sales Performance</h2>
      <div className="h-64 bg-zinc-700 rounded-lg flex items-center justify-center">
        <svg width="300" height="200" viewBox="0 0 300 200" className="text-zinc-500">
          <line x1="50" y1="50" x2="250" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="50" x2="50" y2="150" stroke="currentColor" strokeWidth="2" />
          <polyline 
            points="50,150 100,100 150,120 200,80 250,130" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2" 
          />
        </svg>
      </div>
    </div>
  );
}