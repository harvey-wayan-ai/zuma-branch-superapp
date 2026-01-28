import Header from '@/components/Header';
import SummaryCards from '@/components/SummaryCards';
import SalesPerformance from '@/components/SalesPerformance';
import TopSellingProducts from '@/components/TopSellingProducts';
import BottomNavigation from '@/components/BottomNavigation';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <SummaryCards />
        <SalesPerformance />
        <TopSellingProducts />
      </main>
      <BottomNavigation />
    </div>
  );
}