import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: stockData, error: stockError } = await supabase
      .from('master_mutasi_whs')
      .select('"Kode Artikel", "Nama Artikel", "Entitas", tipe, gender, series, "Stock Akhir DDD", "Stock Akhir LJBB", "Stock Akhir MBB", "Stock Akhir UBB", "Stock Akhir Total", ro_ongoing_ddd, ro_ongoing_ljbb, ro_ongoing_mbb, ro_ongoing_ubb');

    if (stockError) {
      console.error('Error fetching dashboard data:', stockError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    const processed = processStockData(stockData || []);

    return NextResponse.json({
      success: true,
      data: processed,
    });
  } catch (error: any) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function processStockData(data: any[]) {
  const articlesMap = new Map();
  
  data.forEach((row) => {
    const code = row['Kode Artikel'];
    if (!articlesMap.has(code)) {
      articlesMap.set(code, {
        code,
        name: row['Nama Artikel'],
        tipe: row.tipe,
        gender: row.gender,
        series: row.series,
        ddd: 0,
        ljbb: 0,
        mbb: 0,
        ubb: 0,
        total: 0,
        ro_ddd: 0,
        ro_ljbb: 0,
        ro_mbb: 0,
        ro_ubb: 0,
      });
    }
    
    const article = articlesMap.get(code);
    article.ddd += Number(row['Stock Akhir DDD']) || 0;
    article.ljbb += Number(row['Stock Akhir LJBB']) || 0;
    article.mbb += Number(row['Stock Akhir MBB']) || 0;
    article.ubb += Number(row['Stock Akhir UBB']) || 0;
    article.total += Number(row['Stock Akhir Total']) || 0;
    article.ro_ddd += Number(row.ro_ongoing_ddd) || 0;
    article.ro_ljbb += Number(row.ro_ongoing_ljbb) || 0;
    article.ro_mbb += Number(row.ro_ongoing_mbb) || 0;
    article.ro_ubb += Number(row.ro_ongoing_ubb) || 0;
  });

  const articles = Array.from(articlesMap.values());

  const totalStock = articles.reduce((sum, a) => sum + a.total, 0);
  const totalDDD = articles.reduce((sum, a) => sum + a.ddd, 0);
  const totalLJBB = articles.reduce((sum, a) => sum + a.ljbb, 0);
  const totalMBB = articles.reduce((sum, a) => sum + a.mbb, 0);
  const totalUBB = articles.reduce((sum, a) => sum + a.ubb, 0);
  const totalRO = articles.reduce((sum, a) => sum + a.ro_ddd + a.ro_ljbb + a.ro_mbb + a.ro_ubb, 0);

  const byGender = articles.reduce((acc: Record<string, number>, a) => {
    const gender = a.gender || 'Unknown';
    acc[gender] = (acc[gender] || 0) + a.total;
    return acc;
  }, {});

  const bySeries = articles.reduce((acc: Record<string, number>, a) => {
    const series = a.series || 'Unknown';
    acc[series] = (acc[series] || 0) + a.total;
    return acc;
  }, {});

  const byTipe = articles.reduce((acc: Record<string, number>, a) => {
    const tipe = a.tipe || 'Unknown';
    acc[tipe] = (acc[tipe] || 0) + a.total;
    return acc;
  }, {});

  const lowStock = articles
    .filter(a => a.total > 0 && a.total < 10)
    .sort((a, b) => a.total - b.total)
    .slice(0, 10);

  const topStock = articles
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const totalArticles = articles.length;

  return {
    summary: {
      totalArticles,
      totalStock,
      totalDDD,
      totalLJBB,
      totalMBB,
      totalUBB,
      totalRO,
      availableStock: totalStock - totalRO,
    },
    breakdown: {
      byGender: Object.entries(byGender).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      bySeries: Object.entries(bySeries).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byTipe: Object.entries(byTipe).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    },
    alerts: {
      lowStock,
    },
    topStock,
  };
}
