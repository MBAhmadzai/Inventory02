import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/definitions';
import { ProductActions } from './product-actions';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formattedDate = new Date(product.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isUsed = product.history.some(h => ['sales_return', 'repair_return', 'fixed'].includes(h.status));


  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
                <CardTitle>{product.brand} {product.name}</CardTitle>
                <CardDescription className="pt-1">{product.idType.toUpperCase()}: {product.id}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                {isUsed && product.status === 'available' && <Badge variant="secondary">Used</Badge>}
                <Badge variant="outline" className={`status-${product.status.replace(/_/g, '-')}`}>{product.status.replace(/_/g, ' ')}</Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
             <div>
                <p className="text-muted-foreground">Color</p>
                <p className="font-medium">{product.color}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{product.type}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formattedDate}</p>
            </div>
        </div>
         {product.description && (
          <div>
            <p className="text-muted-foreground text-sm">Description</p>
            <p className="text-sm">{product.description}</p>
          </div>
        )}
      </CardContent>
      {product.status !== 'parts_used' && (
        <CardFooter>
            <ProductActions product={product} />
        </CardFooter>
      )}
    </Card>
  );
}
