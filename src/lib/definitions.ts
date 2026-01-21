
export type ProductStatus = 'available' | 'sold' | 'sales_return' | 'repair_return' | 'in_repair' | 'fixed' | 'archived' | 'parts_used' | 'demo';
export type IdentifierType = 'imei' | 'barcode';

export type Product = {
  id: string;
  idType: IdentifierType;
  brand: string;
  name: string;
  color: string;
  type: string;
  description?: string;
  status: ProductStatus;
  createdAt: number;
  updatedAt: number;
  history: {
    status: ProductStatus;
    timestamp: number;
  }[];
  partsUsed?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  soldAt?: number;
};
