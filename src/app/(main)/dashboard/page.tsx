
'use client';

import React, { useState } from 'react';
import StatsCards from '@/app/components/stats-cards';
import RecentActivityTable from '@/app/components/recent-activity-table';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Eye, Wrench, Download } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ref, get } from 'firebase/database';
import { Product, ProductStatus } from '@/lib/definitions';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, db } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const showQuickAdd = user?.role === 'superadmin';

  const exportFullInventory = async () => {
    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Database connection not found.',
      });
      return;
    }
    setIsExporting(true);
    toast({
      title: 'Starting Export...',
      description: 'Preparing your full inventory report.',
    });

    try {
      const productsRef = ref(db, 'products');
      const snapshot = await get(productsRef);

      if (!snapshot.exists()) {
        toast({
          variant: 'destructive',
          title: 'No data to export',
          description: 'Your inventory is currently empty.',
        });
        return;
      }

      const allProducts: Product[] = Object.values(snapshot.val());

      const statusOrder: ProductStatus[] = ['available', 'sold', 'sales_return', 'repair_return', 'in_repair', 'fixed', 'parts_used'];
      
      const header = [
        "id", "idType", "brand", "name", "color", "type", 
        "status", "description", "customerName", "customerPhone", 
        "customerAddress", "soldAt", "createdAt", "updatedAt"
      ].join(',');

      let csvContent = '';

      statusOrder.forEach(status => {
        const productsInStatus = allProducts.filter(p => p.status === status);
        if (productsInStatus.length > 0) {
          csvContent += `\n"${status.replace(/_/g, ' ').toUpperCase()} PRODUCTS (${productsInStatus.length})"\n`;
          csvContent += header + '\n';
          
          const rows = productsInStatus.map(p => {
            return [
              p.id, p.idType, p.brand, p.name, p.color, p.type,
              p.status, p.description || '', p.customerName || '', p.customerPhone || '',
              p.customerAddress || '', p.soldAt ? format(p.soldAt, 'Pp') : '',
              format(p.createdAt, 'Pp'), format(p.updatedAt, 'Pp')
            ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
          });

          csvContent += rows.join('\n') + '\n';
        }
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `full_inventory_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
          title: 'Export Complete!',
          description: 'Your full inventory report has been downloaded.',
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              An overview of your product inventory and recent activities.
            </p>
          </div>
        </div>

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivityTable />
          </div>
          <div className="space-y-6">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks at your fingertips.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                {showQuickAdd && (
                  <Button asChild>
                    <Link href="/products"><PlusCircle className="mr-2 h-4 w-4" /> Add New Product</Link>
                  </Button>
                )}
                 <Button onClick={exportFullInventory} disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" /> 
                  {isExporting ? 'Exporting...' : 'Export Full Inventory'}
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/products/sold"><Eye className="mr-2 h-4 w-4" /> View Sales</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/products/repairs"><Wrench className="mr-2 h-4 w-4" /> Manage Repairs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
