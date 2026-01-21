'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Product, IdentifierType } from '@/lib/definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductLabel } from './product-label';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ref, set, update } from 'firebase/database';
import { useRouter, usePathname } from 'next/navigation';


const formSchema = z.object({
  id: z.string().min(1, 'Identifier is required. For bulk entry, this field will be ignored.'),
  brand: z.string().min(2, 'Brand is required.'),
  name: z.string().min(2, 'Name is required.'),
  color: z.string().min(2, 'Color is required.'),
  type: z.string().min(2, 'Type is required.'),
  description: z.string().optional(),
  imeis: z.array(z.object({ value: z.string().min(1, 'Identifier cannot be empty.') })).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  productToEdit?: Product;
  setSheetOpen: (open: boolean) => void;
  idType: IdentifierType;
}

export function ProductForm({ productToEdit, setSheetOpen, idType }: ProductFormProps) {
    const { db } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isBulkAdd = idType === 'imei' && !productToEdit;

    const refinedSchema = formSchema.superRefine((data, ctx) => {
        if (idType === 'imei' && !isBulkAdd && data.id.length < 1) {
            ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'IMEI cannot be empty.',
            path: ['id'],
            });
        }
        if (isBulkAdd && (!data.imeis || data.imeis.length === 0)) {
            ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'At least one IMEI is required for bulk add.',
            path: ['imeis'],
            });
        }
    });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(refinedSchema),
    defaultValues: productToEdit ? {
        id: productToEdit.id,
        brand: productToEdit.brand,
        name: productToEdit.name,
        color: productToEdit.color,
        type: productToEdit.type,
        description: productToEdit.description,
        imeis: [],
    } : {
      id: idType === 'barcode' ? '' : 'bulk-add-placeholder', // Satisfy schema for bulk add
      brand: '',
      name: '',
      color: '',
      type: idType === 'imei' ? 'Smartphone' : 'Accessory',
      description: '',
      imeis: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "imeis",
  });
  
  const [numImeis, setNumImeis] = React.useState(1);
  
  const generateRandomId = () => {
    return Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
  };

  const handleGenerateImeiFields = () => {
    remove(); // Clear existing fields
    for (let i = 0; i < numImeis; i++) {
      append({ value: '' });
    }
  };


  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const [productForLabel, setProductForLabel] = React.useState<Product | null>(null);

  const handlePrintLabel = async (product: Product) => {
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
  
  async function onSubmit(data: ProductFormValues) {
    if (!db) {
        toast({ variant: 'destructive', title: 'Database connection not found.'});
        return;
    }

    setIsSubmitting(true);
    try {
        if (isBulkAdd) {
            const imeiList = data.imeis!.map(imei => imei.value.trim()).filter(Boolean);
            const commonData = {
                brand: data.brand,
                name: data.name,
                color: data.color,
                type: data.type,
                description: data.description,
                idType,
            };
            const timestamp = Date.now();
            const updates: { [key: string]: Omit<Product, 'price' | 'currency'> } = {};
            for (const imei of imeiList) {
                if (imei) {
                    updates[`/products/${imei}`] = {
                        ...commonData,
                        id: imei,
                        status: 'available',
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        history: [{ status: 'available', timestamp }],
                    };
                }
            }
            await update(ref(db), updates);
            toast({ title: 'Success!', description: `${imeiList.length} products added successfully.` });

        } else if (productToEdit) {
            const productRef = ref(db, `products/${productToEdit.id}`);
            const updatedData = {
                ...productToEdit,
                ...data,
                updatedAt: Date.now(),
            };
            await set(productRef, updatedData);
            toast({ title: 'Success!', description: 'Product updated successfully.' });

        } else {
            const productRef = ref(db, `products/${data.id}`);
            const timestamp = Date.now();
            const newProduct: Product = {
                ...data,
                idType,
                status: 'available',
                createdAt: timestamp,
                updatedAt: timestamp,
                history: [{ status: 'available', timestamp }],
            };
            await set(productRef, newProduct);
            toast({
                title: 'Success!',
                description: 'Product added successfully.',
                action: (
                    <Button variant="outline" size="sm" onClick={() => handlePrintLabel(newProduct)}>
                        Print Label
                    </Button>
                ),
            });
        }
        router.replace(pathname);
        setSheetOpen(false);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message || 'An unknown error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const idLabel = idType === 'imei' ? 'IMEI' : 'Barcode';
  const idPlaceholder = idType === 'barcode' ? 'Scan or enter barcode' : 'Enter device identifier';

  return (
    <>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="flex-1 pr-6 -mr-6">
            <div className="space-y-6 py-6">
                {isBulkAdd ? (
                    <div className="space-y-4 rounded-md border p-4">
                        <h4 className="font-semibold">Bulk Add Products</h4>
                        <div className="flex items-end gap-2">
                           <div className="flex-1 space-y-2">
                                <Label htmlFor="num-imeis">Number of Products</Label>
                                <Input
                                    id="num-imeis"
                                    type="number"
                                    min="1"
                                    value={numImeis}
                                    onChange={(e) => setNumImeis(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full"
                                />
                           </div>
                            <Button type="button" variant="outline" onClick={handleGenerateImeiFields}>
                                Generate Fields
                            </Button>
                        </div>
                         {fields.length > 0 && <p className="text-sm text-muted-foreground">Enter the unique identifier for each product below.</p>}
                        {fields.map((field, index) => (
                             <FormField
                                key={field.id}
                                control={form.control}
                                name={`imeis.${index}.value`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Identifier #{index + 1}</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="Enter unique identifier" {...field} />
                                            </FormControl>
                                            <Button type="button" variant="outline" size="icon" onClick={() => form.setValue(`imeis.${index}.value`, generateRandomId())}>
                                                <Sparkles className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                ) : (
                    <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{idLabel}</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input placeholder={idPlaceholder} {...field} disabled={!!productToEdit} />
                                    </FormControl>
                                     {!productToEdit && (
                                        <Button type="button" variant="outline" size="icon" onClick={() => form.setValue('id', generateRandomId())}>
                                            <Sparkles className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Apple" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., iPhone 15 Pro" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Natural Titanium" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Smartphone" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>

                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Optional: Add any extra details about the product."
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setSheetOpen(false)}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !db}>
                {isSubmitting ? 'Saving...' : productToEdit ? 'Save Changes' : isBulkAdd ? 'Add Products' : 'Add Product'}
            </Button>
            </div>
        </form>
        </Form>
        <div className="absolute -left-[9999px] top-0">
            {productForLabel && (
                <div ref={labelRef} style={{ width: '60mm', height: '20mm' }}>
                    <ProductLabel product={productForLabel} />
                </div>
            )}
        </div>
    </>
  );
}
