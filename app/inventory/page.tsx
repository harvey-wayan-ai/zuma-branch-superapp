import Header from '@/components/Header';
import SummaryCards from '@/components/SummaryCards';
import BottomNavigation from '@/components/BottomNavigation';

export default function Inventory() {
  // Dummy data for the product list
  const products = [
    { id: 1, name: 'Product A', currentStock: 50, salesAvg: 20, roRec: 30, status: 'Aman' },
    { id: 2, name: 'Product B', currentStock: 10, salesAvg: 15, roRec: 25, status: 'Warning' },
    { id: 3, name: 'Product C', currentStock: 5, salesAvg: 10, roRec: 20, status: 'Urgent' },
    { id: 4, name: 'Product D', currentStock: 30, salesAvg: 12, roRec: 22, status: 'Aman' },
    { id: 5, name: 'Product E', currentStock: 8, salesAvg: 18, roRec: 28, status: 'Warning' },
  ];

  // Dummy data for top metrics
  const metrics = {
    totalSKU: 120,
    outOfStock: 15,
    incomingPO: 8,
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900 text-zinc-100">
      <Header />
      <main className="flex-1 p-4">
        {/* Top Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-sm text-zinc-400">Total SKU</h3>
            <p className="text-2xl font-bold">{metrics.totalSKU}</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-sm text-zinc-400">Out of Stock</h3>
            <p className="text-2xl font-bold">{metrics.outOfStock}</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-sm text-zinc-400">Incoming PO</h3>
            <p className="text-2xl font-bold">{metrics.incomingPO}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
          />
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-zinc-800 rounded-lg">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="p-3 text-left">Product Name</th>
                <th className="p-3 text-left">Current Stock</th>
                <th className="p-3 text-left">Sales Avg</th>
                <th className="p-3 text-left">RO Rec</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-zinc-700">
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">{product.currentStock}</td>
                  <td className="p-3">{product.salesAvg}</td>
                  <td className="p-3">{product.roRec}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'Aman'
                          ? 'bg-green-900 text-green-300'
                          : product.status === 'Warning'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Request Stock Button */}
        <button className="fixed bottom-20 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg">
          Request Stock
        </button>
      </main>
      <BottomNavigation />
    </div>
  );
}
