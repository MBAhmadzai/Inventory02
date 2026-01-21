'use client';

import React, { useState, useEffect } from 'react';
import { onValue, ref, remove, query, orderByChild, equalTo } from 'firebase/database';
import type { Product } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter, usePathname } from 'next/navigation';

export default function PartsUsedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, db } = useAuth();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!db) return;
    const productsQuery = query(ref(db, 'products'), orderByChild('status'), equalTo('parts_used'));
    
    const unsubscribe = onValue(productsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const partsUsedProducts = Object.values(snapshot.val())
          .sort((a, b) => b.updatedAt - a.updatedAt);
        setProducts(partsUsedProducts);
      } else {
        setProducts([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleDelete = async () => {
    if (!productToDelete || !db) return;

    try {
        await remove(ref(db, `products/${productToDelete.id}`));
        toast({
            title: 'Success',
            description: "Product permanently deleted.",
        });
        router.replace(pathname);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || "Could not delete product.",
        });
    }
    setProductToDelete(null);
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{product.brand} {product.name}</CardTitle>
                        <CardDescription>{product.idType.toUpperCase()}: {product.id}</CardDescription>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        Marked on: {format(new Date(product.updatedAt), 'PPP')}
                    </p>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">Salvaged Parts Log:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md border p-4 bg-secondary/50">{product.partsUsed || 'No details provided.'}</p>
              </CardContent>
               {user?.role === 'superadmin' && (
                <CardFooter className="justify-end">
                    <Button variant="destructive" size="sm" onClick={() => setProductToDelete(product)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Permanently
                    </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No products used for parts.</h2>
          <p className="text-muted-foreground mt-2">When you mark a product as 'used for parts' from the repair page, it will appear here.</p>
        </div>
      )}

      {productToDelete && (
         <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product "{productToDelete.brand} {productToDelete.name}" from the database.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                >
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
