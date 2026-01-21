
'use client';
import { ProductReportOutput } from '@/ai/flows/generate-report-flow';

export function ReportTemplate({ data }: { data: ProductReportOutput }) {
  return (
    <div className="bg-white text-black text-sm p-8 font-sans">
      <header className="text-center pb-4 border-b-2 border-black">
        <h1 className="font-bold text-2xl tracking-wider">{data.reportTitle}</h1>
        <p className="text-xs text-gray-600">
          For the period of {data.startDate} to {data.endDate}
        </p>
      </header>

      <div className="w-full mt-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-2 pr-2 w-2/5 font-semibold">Product Name</th>
              <th className="text-left py-2 px-2 font-semibold">Entry Time</th>
              <th className="text-left py-2 px-2 font-semibold">Sold Time</th>
              <th className="text-left py-2 pl-2 font-semibold">State</th>
            </tr>
          </thead>
          <tbody>
            {data.products.length > 0 ? data.products.map((product, index) => (
              <tr key={index} className="border-b border-dashed border-gray-300">
                <td className="py-2 pr-2">{product.name}</td>
                <td className="py-2 px-2">{product.entryTime}</td>
                <td className="py-2 px-2">{product.soldTime}</td>
                <td className="py-2 pl-2">{product.status}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">No product data for this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-6 pt-4 border-t-2 border-black text-right">
        <p className="font-bold">
          <span>Total Items Available for Sale: </span>
          <span>{data.availableItemsCount}</span>
        </p>
      </footer>
    </div>
  );
}
