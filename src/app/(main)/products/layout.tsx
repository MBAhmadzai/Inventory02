'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { pageTitles, pageDescriptions } from '@/lib/page-info';

export default function ProductsPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between md:hidden">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {pageTitles[pathname] || 'Products'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {pageDescriptions[pathname] || 'Manage your products.'}
            </p>
        </div>
      </div>
      {children}
    </div>
  );
}
