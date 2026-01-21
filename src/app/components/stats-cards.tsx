'use client';

import React, { useState, useEffect } from 'react';
import { onValue, ref } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/definitions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Archive, Store, DollarSign, Wrench } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';


const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

export default function StatsCards() {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    sold: 0,
    inRepair: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useAuth();

  useEffect(() => {
    if (!db) return;
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const products: Record<string, Product> = snapshot.val();
        const productList = Object.values(products);
        
        const total = productList.length;
        const available = productList.filter(p => p.status === 'available').length;
        const sold = productList.filter(p => p.status === 'sold').length;
        const inRepair = productList.filter(p => p.status === 'in_repair').length;

        setStats({ total, available, sold, inRepair });
      } else {
        setStats({ total: 0, available: 0, sold: 0, inRepair: 0 });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Products" value={stats.total} icon={Archive} isLoading={isLoading || !db} />
      <StatCard title="Available for Sale" value={stats.available} icon={Store} isLoading={isLoading || !db} />
      <StatCard title="Total Sold" value={stats.sold} icon={DollarSign} isLoading={isLoading || !db} />
      <StatCard title="In Repair" value={stats.inRepair} icon={Wrench} isLoading={isLoading || !db} />
    </div>
  );
}
