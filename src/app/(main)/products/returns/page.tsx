'use client';

import React from 'react';
import { ProductsDataTable } from '@/app/components/products-data-table';

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <ProductsDataTable statusFilter={['sales_return', 'repair_return']} />
    </div>
  );
}
