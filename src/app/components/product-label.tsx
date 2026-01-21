
'use client';

import { Product } from '@/lib/definitions';
import React from 'react';
import Barcode from 'react-barcode';

interface ProductLabelProps {
  product: Product;
}

export function ProductLabel({ product }: ProductLabelProps) {
  return (
    <div
      className="bg-white text-black flex flex-col justify-center items-center p-1"
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
      }}
    >
      <div 
        style={{ 
            fontWeight: 'bold', 
            fontSize: '12px', 
            textAlign: 'center',
            marginBottom: '2px'
        }}
      >
        {product.brand.toUpperCase()}
      </div>
      
      <div style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
         <Barcode 
            value={product.id} 
            width={1.2}
            height={20}
            format="CODE128"
            displayValue={true}
            fontSize={10}
            margin={0}
            background="transparent"
            lineColor="black"
        />
      </div>

      <div style={{ fontSize: '9px', textAlign: 'center', marginTop: '2px' }}>
        {product.name} - {product.color}
      </div>
    </div>
  );
}
