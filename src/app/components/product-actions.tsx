'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { Product, ProductStatus } from '@/lib/definitions';
import {
  DollarSign,
  Undo2,
  Wrench,
  CheckCircle,
  Archive,
  RefreshCcw,
  Cog,
  Store,
  Send,
  Presentation
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ref, update } from 'firebase/database';
import { useRouter, usePathname } from 'next/navigation';

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const { db } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [openDialog, setOpenDialog] = useState<ProductStatus | null>(null);
  const [partsUsed, setPartsUsed] = useState('');
  const [customerName, setCustomerName] = useState(product.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(product.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(product.customerAddress || '');


  const handleAction = async (newStatus: ProductStatus) => {
    if (!db) {
        toast({ variant: 'destructive', title: 'Database connection not found.'});
        return;
    }
    
    let details: any = {};
    if (newStatus === 'fixed' || newStatus === 'parts_used') {
      if (!partsUsed && newStatus === 'parts_used') {
          toast({ variant: 'destructive', title: 'Error', description: 'Please describe the parts used.' });
          return;
      }
      details = { partsUsed };
    }

    if (newStatus === 'sold' && product.status !== 'fixed') {
      if (!customerName || !customerPhone || !customerAddress) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all customer details.' });
        return;
      }
      details = { customerName, customerPhone, customerAddress };
    }
    
    try {
        const productRef = ref(db, `products/${product.id}`);
        const timestamp = Date.now();
        const newHistoryEntry = { status: newStatus, timestamp };

        const updates: Partial<Product> = {
            status: newStatus,
            updatedAt: timestamp,
            history: [...(product.history || []), newHistoryEntry],
        };

        if (newStatus === 'sold') {
            updates.customerName = details.customerName || customerName;
            updates.customerPhone = details.customerPhone || customerPhone;
            updates.customerAddress = details.customerAddress || customerAddress;
            updates.soldAt = timestamp;
        }

        if ((newStatus === 'fixed' || newStatus === 'parts_used') && details.partsUsed) {
            updates.partsUsed = (product.partsUsed ? product.partsUsed + '\n' : '') + `[${new Date().toLocaleString()}] ` + details.partsUsed;
        }
        
        if (newStatus === 'available') {
            updates.customerName = '';
            updates.customerPhone = '';
            updates.customerAddress = '';
            updates.soldAt = undefined;
        }

        await update(productRef, updates);
        toast({ title: 'Success', description: `Product status updated to ${newStatus}.` });
        router.replace(pathname);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update product status.' });
    }

    setOpenDialog(null);
    setPartsUsed('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
  };

  const ActionButton = ({
    status,
    label,
    icon: Icon,
    variant = 'outline',
    className = ''
  }: {
    status: ProductStatus;
    label: string;
    icon: React.ElementType;
    variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link';
    className?: string;
  }) => (
    <AlertDialogTrigger asChild>
      <Button variant={variant} size="sm" onClick={() => setOpenDialog(status)} className={className}>
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </AlertDialogTrigger>
  );

  const getActions = (status: ProductStatus) => {
    switch (status) {
      case 'available':
        return <ActionButton status="sold" label="Sell" icon={DollarSign} variant="default" className="w-full"/>;
      case 'sold':
        return (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <ActionButton status="sales_return" label="Sales Return" icon={Undo2} className="w-full" />
            <ActionButton status="repair_return" label="Repair Return" icon={Wrench} className="w-full" />
          </div>
        );
      case 'sales_return':
        return <ActionButton status="available" label="Restock" icon={RefreshCcw} className="w-full"/>;
      case 'repair_return':
        return <ActionButton status="in_repair" label="Start Repair" icon={Wrench} className="w-full"/>;
      case 'in_repair':
        return (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <ActionButton status="fixed" label="Mark as Fixed" icon={CheckCircle} className="w-full" />
            <ActionButton status="parts_used" label="Use for Parts" icon={Cog} variant="destructive" className="w-full" />
          </div>
        );
      case 'fixed':
        return (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <ActionButton status="sold" label="Return to Customer" icon={Send} className="w-full"/>
            <ActionButton status="available" label="Send to For Sale" icon={Store} className="w-full"/>
          </div>
        );
      case 'demo':
        return null; // No actions for demo items to keep them isolated.
      default:
        return null;
    }
  };

  const dialogContent = {
    sold: { 
      title: product.status === 'fixed' ? 'Return to Customer' : 'Confirm Sale', 
      description: product.status === 'fixed' ? `This will mark the product as 'sold' and return it to the customer.` : 'Please enter the customer\'s details below.',
      extraContent: product.status !== 'fixed' ? (
          <div className="grid gap-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input id="customer-name" placeholder="John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Customer Phone</Label>
              <Input id="customer-phone" placeholder="e.g., 0771234567" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-address">Customer Address</Label>
              <Input id="customer-address" placeholder="e.g., 123 Galle Road, Colombo 03" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
            </div>
          </div>
      ) : null,
    },
    sales_return: { title: 'Confirm Sales Return', description: `Are you sure you want to process a sales return? The product will be marked for restocking.` },
    repair_return: { title: 'Confirm Repair Return', description: `Are you sure you want to process a repair return? The product will be sent for diagnostics.` },
    in_repair: { title: 'Start Repair', description: `Are you sure you want to move this product to 'In Repair'?` },
    available: { 
      title: product.status === 'fixed' ? 'Send to "For Sale"' : 'Confirm Restock',
      description: product.status === 'fixed' ? `Are you sure you want to make this product available for sale? It will be marked as 'Used'.` : `Are you sure you want to restock this product and make it available for sale?` 
    },
    fixed: {
      title: 'Confirm Repair Completion',
      description: 'Add any parts used during the repair (optional).',
      extraContent: (
        <div className="grid gap-2 mt-4">
          <Label htmlFor="parts-used-fixed">Parts Used</Label>
          <Textarea id="parts-used-fixed" placeholder="e.g., 1x Screen Assembly, 1x Battery" value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} />
        </div>
      ),
    },
    parts_used: {
      title: 'Use Product for Parts',
      description: 'Describe which parts were used from this product. This action cannot be undone.',
      extraContent: (
        <div className="grid gap-2 mt-4">
          <Label htmlFor="parts-used-scrapped">Parts Used Description</Label>
          <Textarea id="parts-used-scrapped" placeholder="e.g., Salvaged screen and battery for another repair." value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} />
        </div>
      ),
    },
    archived: { title: 'Archive Product', description: `Are you sure you want to archive this product? It will be hidden from most views.` },
    demo: { title: 'Send to Demo', description: `Are you sure you want to move this product to the 'Demo' list? It will be removed from the 'For Sale' list.` },
  };

  const currentDialog = openDialog ? dialogContent[openDialog as keyof typeof dialogContent] : null;

  return (
    <AlertDialog open={!!openDialog} onOpenChange={(isOpen) => !isOpen && setOpenDialog(null)}>
      <div className="flex w-full">
        {getActions(product.status)}
      </div>
      
      {currentDialog && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{currentDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {currentDialog.extraContent}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleAction(openDialog!)}
              variant={openDialog === 'parts_used' ? 'destructive' : 'default'}
              disabled={!db}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
