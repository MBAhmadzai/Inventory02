'use client';

import { MoreHorizontal, Edit, Trash2, Printer, Wrench } from 'lucide-react';
import { Row } from '@tanstack/react-table';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/lib/definitions';
import { ProductForm } from './product-form';
import React from 'react';
import { ProductLabel } from './product-label';
import { RepairOrder } from './repair-order';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '@/hooks/use-auth';
import { ref, remove } from 'firebase/database';
import { useRouter, usePathname } from 'next/navigation';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const { user, db } = useAuth();
  const product = row.original as Product;
  const router = useRouter();
  const pathname = usePathname();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showEditSheet, setShowEditSheet] = React.useState(false);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const repairOrderRef = React.useRef<HTMLDivElement>(null);
  const [productForLabel, setProductForLabel] = React.useState<Product | null>(null);
  const [productForRepair, setProductForRepair] = React.useState<Product | null>(null);

  const isReturn = ['sales_return', 'repair_return'].includes(product.status);
  const canEdit = user?.role === 'superadmin';
  const canDelete = user?.role === 'superadmin';


  const handlePrintLabel = async () => {
    setProductForLabel(product);
    
    setTimeout(async () => {
        if (!labelRef.current) return;
        try {
            const canvas = await html2canvas(labelRef.current, { scale: 3 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [60, 20]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 60, 20);
            pdf.save(`label-${product.id}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            toast({
                variant: "destructive",
                title: "Error printing label",
                description: "There was a problem creating the PDF.",
            });
        } finally {
            setProductForLabel(null);
        }
    }, 100);
  };

  const handlePrintRepairOrder = () => {
    setProductForRepair(product);
    setTimeout(async () => {
      if (!repairOrderRef.current) return;
      try {
        const canvas = await html2canvas(repairOrderRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`repair-order-${product.id}.pdf`);

        toast({
          title: 'Repair Order Generated',
          description: 'The repair order PDF has been downloaded.',
        });

      } catch (error) {
        console.error("Failed to generate repair order PDF:", error);
        toast({
            variant: "destructive",
            title: "Error creating PDF",
            description: "There was a problem creating the repair order.",
        });
      } finally {
        setProductForRepair(null);
      }
    }, 100);
  };
  
    const handleDelete = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Database connection not found.'});
            return;
        }
        setShowDeleteDialog(false);
        toast({
            title: 'Deleting...',
            description: 'Please wait while the product is being deleted.',
        });

        try {
            const productRef = ref(db, `products/${product.id}`);
            await remove(productRef);
            toast({
                title: 'Success',
                description: 'Product deleted successfully.',
            });
            router.replace(pathname);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete product.',
            });
        }
    }


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          {canEdit && (
            <DropdownMenuItem onSelect={() => setShowEditSheet(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={handlePrintLabel}>
            <Printer className="mr-2 h-4 w-4" /> Print Label
          </DropdownMenuItem>
          {isReturn && (
            <DropdownMenuItem onSelect={handlePrintRepairOrder}>
              <Wrench className="mr-2 h-4 w-4" /> Print Repair Order
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Sheet */}
      {canEdit && (
        <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
          <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Product</SheetTitle>
              <SheetDescription>
                Update the details for {product.idType.toUpperCase()}: {product.id}.
              </SheetDescription>
            </SheetHeader>
            <ProductForm productToEdit={product} setSheetOpen={setShowEditSheet} idType={product.idType} />
          </SheetContent>
        </Sheet>
      )}

      {/* Delete Dialog */}
      {canDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product "{product.brand} {product.name}" from the database.
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

       <div className="absolute -left-[9999px] top-0">
          {productForLabel && (
              <div ref={labelRef} style={{ width: '60mm', height: '20mm' }}>
                  <ProductLabel product={productForLabel} />
              </div>
          )}
          {productForRepair && (
            <div ref={repairOrderRef} className="w-[210mm]">
              <RepairOrder product={productForRepair} />
            </div>
          )}
      </div>
    </>
  );
}
