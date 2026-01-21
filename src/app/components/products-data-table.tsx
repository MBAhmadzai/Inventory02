'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { onValue, ref, query, orderByChild, equalTo, update } from 'firebase/database';
import type { Product, ProductStatus } from '@/lib/definitions';
import { DataTableRowActions } from './data-table-row-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductActions } from './product-actions';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, DollarSign } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';

interface ProductsDataTableProps {
  statusFilter?: ProductStatus | ProductStatus[] | 'used';
}

export function ProductsDataTable({ statusFilter }: ProductsDataTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { db } = useAuth();
  const [isBulkSellDialogOpen, setBulkSellDialogOpen] = React.useState(false);
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');

  const getInitialVisibility = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return {
      // Columns that are part of other cells or less important are hidden by default
      "id": false,
      "brand": false,
      "description": false,
      "createdAt": false,
      "customerAddress": false,
      "customerPhone": false,
      
      // Columns to show by default on desktop
      "color": !isMobile,
      "type": !isMobile,
      "updatedAt": !isMobile,
      "soldAt": !isMobile,
      "customerName": !isMobile,

      // Always show status
      "status": true,
    };
  };
  
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(getInitialVisibility());
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<Product>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
    },
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <div className="font-medium">{row.original.brand} {row.getValue('name')}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.idType.toUpperCase()}: {row.original.id}
          </div>
        </div>
      ),
    },
     {
      accessorKey: 'color',
      header: 'Color',
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
     {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isUsed = row.original.history.some(h => ['sales_return', 'repair_return', 'fixed'].includes(h.status));
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`status-${row.getValue<string>('status').replace(/_/g, '-')}`}>{row.getValue<string>('status').replace(/_/g, ' ')}</Badge>
            {isUsed && row.original.status === 'available' && <Badge variant="secondary">Used</Badge>}
          </div>
        );
      },
    },
     {
      accessorKey: 'customerName',
      header: 'Customer Name',
    },
    {
      accessorKey: 'customerPhone',
      header: 'Customer Phone',
    },
    {
      accessorKey: 'customerAddress',
      header: 'Customer Address',
    },
    {
      accessorKey: 'soldAt',
      header: 'Date Sold',
      cell: ({ row }) => {
        const soldAt = row.getValue('soldAt');
        return soldAt ? <div>{format(new Date(soldAt as number), 'PPP p')}</div> : null;
      }
    },
     {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => <div>{format(new Date(row.getValue('createdAt')), 'PPP')}</div>
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => <div>{format(new Date(row.getValue('updatedAt')), 'PPP')}</div>
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.status === 'parts_used') return null;
        return <div className="min-w-[150px]"><ProductActions product={row.original} /></div>;
      }
    },
    {
      id: 'context-menu',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
        pagination: {
            pageSize: 10,
        },
    },
  });

  React.useEffect(() => {
    if (!db) return;

    const productsRef = ref(db, 'products');
    let productsQuery = query(productsRef);

    if (statusFilter && typeof statusFilter === 'string' && statusFilter !== 'used') {
      productsQuery = query(productsRef, orderByChild('status'), equalTo(statusFilter));
    }
    
    const unsubscribe = onValue(productsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const productsData: Record<string, Product> = snapshot.val();
        let productsList: Product[] = Object.values(productsData);

        if (statusFilter) {
          if (statusFilter === 'used') {
            productsList = productsList.filter(p => 
                p.status === 'available' && 
                p.history.some(h => ['sales_return', 'repair_return', 'fixed'].includes(h.status))
            );
          } else if (Array.isArray(statusFilter)) {
            productsList = productsList.filter(p => statusFilter.includes(p.status));
          }
        }

        setData(productsList);
      } else {
        setData([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [statusFilter, db]);
  
  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setColumnVisibility(current => ({
        ...current,
        "color": !isMobile,
        "type": !isMobile,
        "updatedAt": !isMobile,
        "soldAt": !isMobile,
        "customerName": !isMobile,
      }));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getExportData = () => {
    const header = [
        "id", "idType", "brand", "name", "color", "type", 
        "status", "description", "customerName", "customerPhone", 
        "customerAddress", "soldAt", "createdAt", "updatedAt"
    ];

    const rows = table.getFilteredRowModel().rows.map(row => {
      const p = row.original;
      return [
        p.id, p.idType, p.brand, p.name, p.color, p.type,
        p.status, p.description || '', p.customerName || '', p.customerPhone || '',
        p.customerAddress || '', p.soldAt ? format(p.soldAt, 'Pp') : '',
        format(p.createdAt, 'Pp'), format(p.updatedAt, 'Pp')
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });

    return [header.join(','), ...rows].join('\n');
  };

  const handleExport = () => {
    if (table.getFilteredRowModel().rows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No data to export',
        description: 'The current list is empty.',
      });
      return;
    }

    const csvContent = getExportData();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    
    const statusPart = statusFilter ? (Array.isArray(statusFilter) ? statusFilter.join('_') : statusFilter) : 'all';
    link.setAttribute('download', `products_${statusPart}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: 'Export successful',
        description: 'The product list has been downloaded as a CSV file.',
    });
  };

  const handleBulkSell = async () => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Database connection not found.' });
      return;
    }
    if (!customerName || !customerPhone || !customerAddress) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all customer details.' });
      return;
    }

    const selectedProducts = table.getSelectedRowModel().rows
      .map(row => row.original)
      .filter(product => ['available', 'fixed'].includes(product.status));

    if (selectedProducts.length === 0) {
      toast({ variant: 'destructive', title: 'No valid items selected', description: 'Only items that are "Available" or "Fixed" can be sold.' });
      setBulkSellDialogOpen(false);
      return;
    }

    toast({
      title: 'Processing Bulk Sale...',
      description: `Updating ${selectedProducts.length} products.`,
    });

    const timestamp = Date.now();
    const updates: { [key: string]: any } = {};

    for (const product of selectedProducts) {
      const newHistoryEntry = { status: 'sold' as ProductStatus, timestamp };
      updates[`/products/${product.id}`] = {
        ...product,
        status: 'sold',
        updatedAt: timestamp,
        history: [...(product.history || []), newHistoryEntry],
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        soldAt: timestamp,
      };
    }

    try {
      await update(ref(db), updates);
      toast({
        title: 'Bulk Sale Successful!',
        description: `${selectedProducts.length} products have been marked as sold.`,
      });
      router.replace(pathname);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Bulk Sale Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setBulkSellDialogOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      table.resetRowSelection();
    }
  };


  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Input
            placeholder="Filter by product name..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="w-full sm:max-w-sm"
          />
          <div className="flex w-full sm:w-auto items-center gap-2">
            {table.getSelectedRowModel().rows.length > 0 && (
              <Button variant="default" onClick={() => setBulkSellDialogOpen(true)} className="w-full">
                <DollarSign className="mr-2 h-4 w-4" />
                Sell {table.getSelectedRowModel().rows.length} items
              </Button>
            )}
            <Button variant="outline" onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto w-full sm:w-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    if (['context-menu', 'actions', 'id', 'brand'].includes(column.id)) return null;
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id.replace(/([A-Z])/g, ' $1')}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="rounded-md border-t overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </tr>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading || !db ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No products found for this category.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-2 p-4 border-t">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
       </CardContent>

      <AlertDialog open={isBulkSellDialogOpen} onOpenChange={setBulkSellDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bulk Sell Products</AlertDialogTitle>
                <AlertDialogDescription>
                    Enter customer details for the {table.getSelectedRowModel().rows.length} selected products. Only items that are "Available" or "Fixed" will be processed.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="bulk-customer-name">Customer Name</Label>
                    <Input id="bulk-customer-name" placeholder="John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="bulk-customer-phone">Customer Phone</Label>
                    <Input id="bulk-customer-phone" placeholder="e.g., 0771234567" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="bulk-customer-address">Customer Address</Label>
                    <Input id="bulk-customer-address" placeholder="e.g., 123 Galle Road, Colombo 03" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkSell}>Confirm Sale</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </Card>
  );
}
