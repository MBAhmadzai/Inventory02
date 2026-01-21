'use client';

import React from 'react';
import { ProductsDataTable } from '@/app/components/products-data-table';

export default function UsedPage() {
  return (
    <div className="space-y-6">
      <ProductsDataTable statusFilter="used" />
    </div>
  );
}
