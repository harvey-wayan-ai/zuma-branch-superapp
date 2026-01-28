export default function Header() {
  return (
    <header className="bg-zinc-800 p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Branch Name</h1>
      <div className="w-10 h-10 rounded-full bg-zinc-600 flex items-center justify-center">
        <span className="text-sm">👤</span>
      </div>
    </header>
  );
}