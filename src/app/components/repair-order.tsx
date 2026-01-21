'use client';
import { Product } from '@/lib/definitions';
import { format } from 'date-fns';

export function RepairOrder({ product }: { product: Product }) {
  const returnHistory = product.history.find(h => ['sales_return', 'repair_return'].includes(h.status));
  const returnDate = returnHistory ? format(new Date(returnHistory.timestamp), 'PPP') : 'N/A';

  return (
    <div className="bg-white text-black text-sm p-8 font-sans">
      <div className="border-2 border-black p-6">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b-2 border-black">
          <div className="text-xs">
            <h1 className="font-bold text-lg">East Coast Electronics</h1>
            <p>206, Galle Road, Bambalapitiya, Colombo 04</p>
            <p>sales.electronics@eastcoast.lk | 0766466771</p>
          </div>
          <div className="text-right">
             <h2 className="font-bold text-2xl">REPAIR ORDER</h2>
             <p className="text-sm">Job No: {product.id.slice(-6)}</p>
          </div>
        </header>

        {/* Customer & Product Info */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-dashed border-black text-xs">
            <div>
                <h3 className="font-bold underline mb-2">CUSTOMER DETAILS</h3>
                <p><span className="font-semibold">Name:</span> {product.customerName || '____________________'}</p>
                <p><span className="font-semibold">Phone:</span> {product.customerPhone || '____________________'}</p>
            </div>
             <div>
                <h3 className="font-bold underline mb-2">PRODUCT DETAILS</h3>
                <p><span className="font-semibold">Item:</span> {product.brand} {product.name}</p>
                <p><span className="font-semibold">{product.idType.toUpperCase()}/Serial:</span> {product.id}</p>
            </div>
        </div>

        {/* Reported Issue */}
        <div className="py-4 border-b border-dashed border-black">
            <h3 className="font-bold underline mb-2 text-xs">REPORTED ISSUE / FAULT</h3>
            <div className="h-24 w-full border border-gray-400 rounded-sm p-1"></div>
        </div>
        
        {/* Terms and Conditions */}
        <div className="py-4 text-[10px] text-gray-700">
            <h3 className="font-bold underline mb-2 text-xs text-black">TERMS & CONDITIONS</h3>
            <ul className="list-decimal list-inside space-y-1">
                <li>The customer must present this receipt to collect the item.</li>
                <li>A diagnostic fee may be applicable if the customer decides not to proceed with the repair.</li>
                <li>The company is not responsible for any data loss. Please back up your device.</li>
                <li>Repaired items must be collected within 30 days of notification, after which the company reserves the right to dispose of the item to recover costs.</li>
                <li>Warranty on repairs is limited to the specific components replaced and work performed.</li>
            </ul>
        </div>

        {/* Signatures */}
        <footer className="flex justify-between items-end pt-8 mt-8 text-xs">
            <div className="text-center">
                <div className="border-t border-black w-48 pt-1">Customer Signature</div>
            </div>
            <div className="text-center">
                <div className="border-t border-black w-48 pt-1">Authorized Signature</div>
            </div>
             <div className="text-center">
                <p><span className="font-semibold">Date:</span> {returnDate}</p>
            </div>
        </footer>
      </div>
    </div>
  );
}
