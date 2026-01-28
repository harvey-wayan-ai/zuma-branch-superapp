import { Home, Package, FileText, User } from 'lucide-react';
import Link from 'next/link';

export function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
      <Link href="/" className="flex flex-col items-center">
        <Home className="h-5 w-5" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      <Link href="/sku" className="flex flex-col items-center">
        <Package className="h-5 w-5" />
        <span className="text-xs mt-1">SKU</span>
      </Link>
      <Link href="/ro" className="flex flex-col items-center">
        <FileText className="h-5 w-5" />
        <span className="text-xs mt-1">RO</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center">
        <User className="h-5 w-5" />
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </div>
  );
}