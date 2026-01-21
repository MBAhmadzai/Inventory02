'use client';

import React, { useState, useEffect } from 'react';
import { onValue, ref, query, orderByChild, limitToLast } from 'firebase/database';
import { formatDistanceToNow } from 'date-fns';
import type { Product } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';


export default function RecentActivityTable() {
  const [activities, setActivities] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useAuth();

  useEffect(() => {
    if (!db) return;
    const activityQuery = query(ref(db, 'products'), orderByChild('updatedAt'), limitToLast(7));
    const unsubscribe = onValue(activityQuery, (snapshot) => {
      if (snapshot.exists()) {
        const activitiesData: Record<string, Product> = snapshot.val();
        const activitiesList = Object.values(activitiesData).sort((a, b) => b.updatedAt - a.updatedAt);
        setActivities(activitiesList);
      } else {
        setActivities([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Recent Activity</CardTitle>
        <CardDescription>A log of the latest product status changes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !db ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : activities.length > 0 ? (
                activities.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium min-w-[150px]">{product.brand} {product.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{product.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`status-${product.status.replace(/_/g, '-')}`}>{product.status.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm min-w-[120px]">
                      {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No recent activity.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
