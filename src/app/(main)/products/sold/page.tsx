
'use client';

import React, { useState, useEffect } from 'react';
import { onValue, ref, query, orderByChild, equalTo } from 'firebase/database';
import type { Product } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { User, Smartphone, ScanLine, Phone, Home, ShoppingCart, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductActions } from '@/app/components/product-actions';

interface GroupedSales {
  [key: string]: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    products: Product[];
  };
}

export default function SoldPage() {
  const [groupedSales, setGroupedSales] = useState<GroupedSales>({});
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useAuth();

  useEffect(() => {
    if (!db) return;
    const productsQuery = query(ref(db, 'products'), orderByChild('status'), equalTo('sold'));
    
    const unsubscribe = onValue(productsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const soldProducts: Product[] = Object.values(snapshot.val());
        
        const salesByCustomer = soldProducts.reduce((acc: GroupedSales, product) => {
          const customerKey = `${product.customerName}-${product.customerPhone}`;
          if (!acc[customerKey]) {
            acc[customerKey] = {
              customerName: product.customerName || 'Unknown Customer',
              customerPhone: product.customerPhone || 'N/A',
              customerAddress: product.customerAddress || 'N/A',
              products: [],
            };
          }
          acc[customerKey].products.push(product);
          acc[customerKey].products.sort((a, b) => (b.soldAt || 0) - (a.soldAt || 0));
          return acc;
        }, {});

        const sortedCustomerKeys = Object.keys(salesByCustomer).sort((a, b) => {
            const lastSaleA = salesByCustomer[a].products[0]?.soldAt || 0;
            const lastSaleB = salesByCustomer[b].products[0]?.soldAt || 0;
            return lastSaleB - lastSaleA;
        });
        
        const sortedGroupedSales: GroupedSales = {};
        for(const key of sortedCustomerKeys) {
            sortedGroupedSales[key] = salesByCustomer[key];
        }

        setGroupedSales(sortedGroupedSales);
      } else {
        setGroupedSales({});
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const generateCsvContent = (data: Product[], headerPrefix: string = '') => {
    const header = ["Product Name", "Identifier", "Date/Time Sold"];
    let content = headerPrefix ? `${headerPrefix}\n` : '';
    content += header.map(h => `"${h}"`).join(',') + '\n';
    
    const rows = data.map(p => {
        return [
            `${p.brand} ${p.name}`,
            p.id,
            p.soldAt ? format(p.soldAt, 'PPP p') : 'N/A'
        ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });

    content += rows.join('\n');
    return content;
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Export Complete!',
      description: `The file ${filename} has been downloaded.`,
    });
  };

  const exportAllSales = () => {
    if (Object.keys(groupedSales).length === 0) {
      toast({ variant: 'destructive', title: 'No data to export.' });
      return;
    }
    let fullCsvContent = '';
    for (const key in groupedSales) {
        const group = groupedSales[key];
        const customerHeader = `"Customer: ${group.customerName}","Phone: ${group.customerPhone}","Address: ${group.customerAddress}"`;
        fullCsvContent += generateCsvContent(group.products, customerHeader) + '\n\n';
    }
    downloadCsv(fullCsvContent, `all_sales_report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportCustomerSales = (customerGroup: GroupedSales[string]) => {
     const customerHeader = `"Customer: ${customerGroup.customerName}","Phone: ${customerGroup.customerPhone}","Address: ${customerGroup.customerAddress}"`;
     const customerCsvContent = generateCsvContent(customerGroup.products, customerHeader);
     downloadCsv(customerCsvContent, `sales_report_${customerGroup.customerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {Object.keys(groupedSales).length > 0 ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={exportAllSales}>
              <Download className="mr-2 h-4 w-4" />
              Export All Sales
            </Button>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {Object.values(groupedSales).map((group, index) => (
              <AccordionItem value={group.customerName + index} key={group.customerName + index} className="border-b-0">
                  <Card>
                      <CardHeader>
                          <AccordionTrigger className="w-full p-0 hover:no-underline">
                              <div className="flex justify-between items-center w-full">
                                  <div className='text-left'>
                                      <CardTitle className="flex items-center gap-2">
                                          <User className="h-5 w-5"/>
                                          {group.customerName}
                                      </CardTitle>
                                      <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
                                          <span className="flex items-center gap-2"><Phone className="h-3 w-3"/>{group.customerPhone}</span>
                                          <span className="flex items-center gap-2"><Home className="h-3 w-3"/>{group.customerAddress}</span>
                                      </CardDescription>
                                  </div>
                                  <Badge variant="secondary">{group.products.length} item(s)</Badge>
                             </div>
                          </AccordionTrigger>
                      </CardHeader>
                      <AccordionContent>
                          <CardContent className="pt-0">
                              <div className="space-y-4 pt-4 border-t">
                                  {group.products.map(product => (
                                       <div key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-md border bg-muted/50 gap-4">
                                          <div className="flex-1">
                                              <p className="font-semibold">{product.brand} {product.name}</p>
                                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                  {product.idType === 'imei' ? <Smartphone className="h-3 w-3"/> : <ScanLine className="h-3 w-3"/>}
                                                  {product.id}
                                              </p>
                                              {product.soldAt && <p className="text-xs text-muted-foreground mt-1">Sold on: {format(new Date(product.soldAt), 'PPP p')}</p>}
                                          </div>
                                          <div className="w-full sm:w-auto">
                                             <ProductActions product={product} />
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </CardContent>
                           <CardFooter className="justify-end pt-4">
                                <Button variant="outline" size="sm" onClick={() => exportCustomerSales(group)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Customer Sales
                                </Button>
                            </CardFooter>
                      </AccordionContent>
                  </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No sold products yet.</h2>
          <p className="text-muted-foreground mt-2">When you sell a product, it will appear here grouped by customer.</p>
        </div>
      )}
    </div>
  );
}
