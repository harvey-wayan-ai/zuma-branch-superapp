export default function BottomNavigation() {
  return (
    <nav className="bg-zinc-800 p-4 fixed bottom-0 left-0 right-0">
      <div className="flex justify-around">
        <button className="text-blue-500 font-bold">Home</button>
        <button className="text-zinc-400">Inventory/RO</button>
        <button className="text-zinc-400">Reports</button>
      </div>
    </nav>
  );
}