export default function TopSellingProducts() {
  const products = [
    { id: 1, name: 'Product A', sales: 120 },
    { id: 2, name: 'Product B', sales: 95 },
    { id: 3, name: 'Product C', sales: 80 },
    { id: 4, name: 'Product D', sales: 65 },
    { id: 5, name: 'Product E', sales: 50 },
  ];

  return (
    <div className="bg-zinc-800 p-4 rounded-lg mb-6">
      <h2 className="text-zinc-400 text-sm mb-2">Top Selling Products</h2>
      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.id} className="flex justify-between items-center">
            <span>{product.name}</span>
            <span className="text-zinc-400">{product.sales} sales</span>
          </li>
        ))}
      </ul>
    </div>
  );
}