export default function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-zinc-800 p-4 rounded-lg">
        <h2 className="text-zinc-400 text-sm">Daily Sales</h2>
        <p className="text-2xl font-bold">$1,234</p>
      </div>
      <div className="bg-zinc-800 p-4 rounded-lg">
        <h2 className="text-zinc-400 text-sm">Weekly Sales</h2>
        <p className="text-2xl font-bold">$8,765</p>
      </div>
      <div className="bg-zinc-800 p-4 rounded-lg">
        <h2 className="text-zinc-400 text-sm">Monthly Target Progress</h2>
        <div className="mt-2">
          <div className="w-full bg-zinc-700 rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <p className="text-sm mt-1 text-zinc-400">65% of $15,000</p>
        </div>
      </div>
    </div>
  );
}